from __future__ import annotations
import re
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Prefetch
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
        serializer.save(owner=request.user)
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
        task = self._get_task(request, task_id)
        if task is None:
            return Response({"error": "Task not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = TaskSerializer(task, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(
                {"error": "Task validation failed.", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save()
        return Response({"task": serializer.data})

    def delete(self, request: Request, task_id: int) -> Response:
        task = self._get_task(request, task_id)
        if task is None:
            return Response({"error": "Task not found."}, status=status.HTTP_404_NOT_FOUND)
        task.delete()
        return Response({"deleted": True})


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


