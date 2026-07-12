from __future__ import annotations

import re
from collections.abc import Mapping
from datetime import date

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Prefetch
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import AnnotatedImage, AnnotationPolygon, Task
from .serializers import AnnotatedImageSerializer, PolygonSerializer, TaskSerializer



#logic for health checks, authentication, user information, task CRUD (filtered by date), image uploads, and polygon annotation persistence

HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
TASK_STATUSES = tuple(value for value, _label in Task.Status.choices)


def _lock_task_owner(user: User) -> None:
    """Serialize every ordered task mutation for one owner."""
    User.objects.select_for_update().only("id").get(id=user.id)


def _scope_tasks(
    *,
    owner_id: int,
    due_date: date,
    task_status: str,
    exclude_id: int | None = None,
) -> list[Task]:
    tasks = Task.objects.select_for_update().filter(
        owner_id=owner_id,
        due_date=due_date,
        status=task_status,
    )
    if exclude_id is not None:
        tasks = tasks.exclude(id=exclude_id)
    return list(tasks.order_by("position", "id"))


def _write_positions(tasks: list[Task], *, start: int = 0) -> None:
    changed: list[Task] = []
    for position, task in enumerate(tasks, start=start):
        if task.position != position:
            task.position = position
            changed.append(task)
    if changed:
        Task.objects.bulk_update(changed, ["position"])


def _parse_reorder_payload(
    payload: object,
) -> tuple[date | None, dict[str, list[int]] | None, str | None]:
    if not isinstance(payload, Mapping):
        return None, None, "The request body must be an object."

    raw_date = payload.get("date")
    if not isinstance(raw_date, str):
        return None, None, "Date must use YYYY-MM-DD format."
    selected_date = parse_date(raw_date)
    if selected_date is None or selected_date.isoformat() != raw_date:
        return None, None, "Date must use YYYY-MM-DD format."

    raw_order = payload.get("order")
    if not isinstance(raw_order, Mapping) or set(raw_order.keys()) != set(TASK_STATUSES):
        return None, None, "Order must contain exactly todo, in_progress, and done."

    order: dict[str, list[int]] = {}
    seen_ids: set[int] = set()
    for task_status in TASK_STATUSES:
        raw_ids = raw_order[task_status]
        if not isinstance(raw_ids, list):
            return None, None, f"Order for {task_status} must be a list."

        task_ids: list[int] = []
        for task_id in raw_ids:
            if type(task_id) is not int or task_id <= 0:
                return None, None, "Every task ID must be a positive integer."
            if task_id in seen_ids:
                return None, None, "A task ID cannot appear more than once."
            seen_ids.add(task_id)
            task_ids.append(task_id)
        order[task_status] = task_ids

    return selected_date, order, None


# ─── Health ───────────────────────────────────────────────────────────────────

class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        return Response({"status": "ok"})


# ─── Auth ─────────────────────────────────────────────────────────────────────

class LoginView(APIView):
    """
    POST { email, password } → { token, user }
    Returns a JWT access token in the same shape the frontend expects,
    so api.ts login() doesn't need to change.
    """
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        email = str(request.data.get("email", "")).strip().lower()
        password = str(request.data.get("password", ""))

        if not email or not password:
            return Response(
                {"error": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            "token": str(refresh.access_token),
            "user": {"id": user.id, "email": user.email or user.username},
        })


class SignupView(APIView):
    """
    POST { email, password } → { token, user }
    Creates a new user account then returns a JWT so the user is
    immediately logged in — no separate login step needed.
    """
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        email = str(request.data.get("email", "")).strip().lower()
        password = str(request.data.get("password", ""))

        if not email or not password:
            return Response(
                {"error": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=email).exists():
            return Response(
                {"error": "An account with this email already exists."},
                status=status.HTTP_409_CONFLICT,
            )

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
        )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "token": str(refresh.access_token),
                "user": {"id": user.id, "email": user.email},
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        return Response({"user": {"id": user.id, "email": user.email or user.username}})


# ─── Tasks ────────────────────────────────────────────────────────────────────

class TaskCollectionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        tasks = Task.objects.filter(owner=request.user)
        selected_date = request.query_params.get("date")
        if selected_date:
            tasks = tasks.filter(due_date=selected_date)
        serializer = TaskSerializer(tasks, many=True)
        return Response({"tasks": serializer.data})

    def post(self, request: Request) -> Response:
        serializer = TaskSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Task validation failed.", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        due_date = serializer.validated_data["due_date"]
        task_status = serializer.validated_data.get("status", Task.Status.TODO)
        with transaction.atomic():
            _lock_task_owner(request.user)
            destination_tasks = _scope_tasks(
                owner_id=request.user.id,
                due_date=due_date,
                task_status=task_status,
            )
            _write_positions(destination_tasks, start=1)
            serializer.save(owner=request.user, position=0)

        return Response({"task": serializer.data}, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_task(self, request: Request, task_id: int) -> Task | None:
        return Task.objects.filter(id=task_id, owner=request.user).first()

    def get(self, request: Request, task_id: int) -> Response:
        task = self._get_task(request, task_id)
        if task is None:
            return Response({"error": "Task not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"task": TaskSerializer(task).data})

    def patch(self, request: Request, task_id: int) -> Response:
        with transaction.atomic():
            _lock_task_owner(request.user)
            task = (
                Task.objects.select_for_update()
                .filter(id=task_id, owner=request.user)
                .first()
            )
            if task is None:
                return Response({"error": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

            serializer = TaskSerializer(task, data=request.data, partial=True)
            if not serializer.is_valid():
                return Response(
                    {"error": "Task validation failed.", "details": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            destination_date = serializer.validated_data.get("due_date", task.due_date)
            destination_status = serializer.validated_data.get("status", task.status)
            scope_changed = (
                destination_date != task.due_date or destination_status != task.status
            )

            if scope_changed:
                source_tasks = _scope_tasks(
                    owner_id=request.user.id,
                    due_date=task.due_date,
                    task_status=task.status,
                    exclude_id=task.id,
                )
                destination_tasks = _scope_tasks(
                    owner_id=request.user.id,
                    due_date=destination_date,
                    task_status=destination_status,
                )
                _write_positions(source_tasks)
                _write_positions(destination_tasks)
                serializer.save(position=len(destination_tasks))
            else:
                serializer.save()

        return Response({"task": serializer.data})

    def delete(self, request: Request, task_id: int) -> Response:
        with transaction.atomic():
            _lock_task_owner(request.user)
            task = (
                Task.objects.select_for_update()
                .filter(id=task_id, owner=request.user)
                .first()
            )
            if task is None:
                return Response({"error": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

            source_date = task.due_date
            source_status = task.status
            task.delete()
            source_tasks = _scope_tasks(
                owner_id=request.user.id,
                due_date=source_date,
                task_status=source_status,
            )
            _write_positions(source_tasks)

        return Response({"deleted": True})


class TaskReorderView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request: Request) -> Response:
        selected_date, order, validation_error = _parse_reorder_payload(request.data)
        if validation_error is not None:
            return Response(
                {"error": validation_error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        assert selected_date is not None
        assert order is not None
        submitted_ids = {
            task_id
            for task_ids in order.values()
            for task_id in task_ids
        }

        with transaction.atomic():
            _lock_task_owner(request.user)
            board_tasks = list(
                Task.objects.select_for_update()
                .filter(owner=request.user, due_date=selected_date)
                .order_by("id")
            )
            current_ids = {task.id for task in board_tasks}
            if submitted_ids != current_ids:
                return Response(
                    {"error": "The task board changed. Fetch the latest tasks and try again."},
                    status=status.HTTP_409_CONFLICT,
                )

            tasks_by_id = {task.id: task for task in board_tasks}
            for task_status, task_ids in order.items():
                for position, task_id in enumerate(task_ids):
                    task = tasks_by_id[task_id]
                    task.status = task_status
                    task.position = position

            if board_tasks:
                Task.objects.bulk_update(board_tasks, ["status", "position"])

            authoritative_tasks = (
                Task.objects.filter(owner=request.user, due_date=selected_date)
                .order_by("status", "position", "id")
            )
            serializer = TaskSerializer(authoritative_tasks, many=True)
            return Response({"tasks": serializer.data})


# ─── Images ───────────────────────────────────────────────────────────────────

class ImageCollectionView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request: Request) -> Response:
        images = (
            AnnotatedImage.objects.filter(owner=request.user)
            .prefetch_related(
                Prefetch("polygons", queryset=AnnotationPolygon.objects.order_by("created_at"))
            )
        )
        serializer = AnnotatedImageSerializer(images, many=True, context={"request": request})
        return Response({"images": serializer.data})

    def post(self, request: Request) -> Response:
        files = request.FILES.getlist("images") or request.FILES.getlist("image")
        if not files:
            return Response(
                {"error": "Upload at least one image."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        created = []
        for uploaded_file in files:
            if uploaded_file.content_type and not uploaded_file.content_type.startswith("image/"):
                return Response(
                    {"error": f"{uploaded_file.name} is not an image."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            image = AnnotatedImage.objects.create(
                owner=request.user,
                image=uploaded_file,
                original_name=uploaded_file.name[:255],
            )
            created.append(image)
        serializer = AnnotatedImageSerializer(created, many=True, context={"request": request})
        return Response({"images": serializer.data}, status=status.HTTP_201_CREATED)


class ImageDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request: Request, image_id: int) -> Response:
        image = AnnotatedImage.objects.filter(id=image_id, owner=request.user).first()
        if image is None:
            return Response({"error": "Image not found."}, status=status.HTTP_404_NOT_FOUND)
        image.image.delete(save=False)
        image.delete()
        return Response({"deleted": True})


# ─── Polygons ─────────────────────────────────────────────────────────────────

class PolygonCollectionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, image_id: int) -> Response:
        image = AnnotatedImage.objects.filter(id=image_id, owner=request.user).first()
        if image is None:
            return Response({"error": "Image not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = PolygonSerializer(image.polygons.all(), many=True)
        return Response({"polygons": serializer.data})

    def post(self, request: Request, image_id: int) -> Response:
        image = AnnotatedImage.objects.filter(id=image_id, owner=request.user).first()
        if image is None:
            return Response({"error": "Image not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PolygonSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Polygon validation failed.", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        color = str(request.data.get("color", "#0f8b8d")).strip()
        if not HEX_COLOR_RE.match(color):
            color = "#0f8b8d"

        polygon = AnnotationPolygon.objects.create(
            image=image,
            points=serializer.validated_data["points"],
            color=color,
            label=str(request.data.get("label", "")).strip()[:80],
        )
        return Response({"polygon": PolygonSerializer(polygon).data}, status=status.HTTP_201_CREATED)


class PolygonDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request: Request, polygon_id: int) -> Response:
        polygon = AnnotationPolygon.objects.filter(id=polygon_id, image__owner=request.user).first()
        if polygon is None:
            return Response({"error": "Polygon not found."}, status=status.HTTP_404_NOT_FOUND)
        polygon.delete()
        return Response({"deleted": True})
