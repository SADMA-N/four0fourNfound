from datetime import date, timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.db import DatabaseError, connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Task


class TaskOrderingAPITests(TestCase):
    board_date = date(2026, 7, 12)

    def setUp(self):
        self.user = User.objects.create_user(
            username="owner@example.com",
            password="password123",
        )
        self.other_user = User.objects.create_user(
            username="other@example.com",
            password="password123",
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.tasks_url = reverse("tasks")
        self.reorder_url = reverse("task-reorder")

    def make_task(
        self,
        title: str,
        *,
        task_status: str = Task.Status.TODO,
        position: int = 0,
        due_date: date | None = None,
        owner: User | None = None,
    ) -> Task:
        return Task.objects.create(
            owner=owner or self.user,
            title=title,
            status=task_status,
            priority=Task.Priority.MEDIUM,
            due_date=due_date or self.board_date,
            position=position,
            tags=[],
        )

    def order_payload(
        self,
        *,
        todo: list[int] | None = None,
        in_progress: list[int] | None = None,
        done: list[int] | None = None,
        due_date: date | None = None,
    ) -> dict:
        return {
            "date": (due_date or self.board_date).isoformat(),
            "order": {
                Task.Status.TODO: todo or [],
                Task.Status.IN_PROGRESS: in_progress or [],
                Task.Status.DONE: done or [],
            },
        }

    def assert_group(
        self,
        expected_tasks: list[Task],
        *,
        task_status: str,
        due_date: date | None = None,
    ) -> None:
        rows = list(
            Task.objects.filter(
                owner=self.user,
                due_date=due_date or self.board_date,
                status=task_status,
            )
            .order_by("position", "id")
            .values_list("id", "position")
        )
        self.assertEqual(
            rows,
            [(task.id, position) for position, task in enumerate(expected_tasks)],
        )

    def test_same_column_reorder_persists_and_returns_positions(self):
        first = self.make_task("First", position=0)
        second = self.make_task("Second", position=1)
        third = self.make_task("Third", position=2)

        response = self.client.put(
            self.reorder_url,
            self.order_payload(todo=[third.id, first.id, second.id]),
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assert_group(
            [third, first, second],
            task_status=Task.Status.TODO,
        )
        response_tasks = [
            task for task in response.data["tasks"] if task["status"] == Task.Status.TODO
        ]
        self.assertEqual(
            [(task["id"], task["position"]) for task in response_tasks],
            [(third.id, 0), (first.id, 1), (second.id, 2)],
        )

        refreshed = self.client.get(
            self.tasks_url,
            {"date": self.board_date.isoformat()},
        )
        refreshed_todo = [
            task for task in refreshed.data["tasks"] if task["status"] == Task.Status.TODO
        ]
        self.assertEqual(
            [task["id"] for task in refreshed_todo],
            [third.id, first.id, second.id],
        )

    def test_cross_column_top_middle_and_bottom_insertion(self):
        insertions = {
            "top": lambda moved, first, second: [moved, first, second],
            "middle": lambda moved, first, second: [first, moved, second],
            "bottom": lambda moved, first, second: [first, second, moved],
        }

        for offset, (label, destination_order) in enumerate(insertions.items()):
            with self.subTest(position=label):
                selected_date = self.board_date + timedelta(days=offset)
                moved = self.make_task(f"Moved {label}", due_date=selected_date)
                first = self.make_task(
                    f"Done first {label}",
                    task_status=Task.Status.DONE,
                    position=0,
                    due_date=selected_date,
                )
                second = self.make_task(
                    f"Done second {label}",
                    task_status=Task.Status.DONE,
                    position=1,
                    due_date=selected_date,
                )
                expected = destination_order(moved, first, second)

                response = self.client.put(
                    self.reorder_url,
                    self.order_payload(
                        done=[task.id for task in expected],
                        due_date=selected_date,
                    ),
                    format="json",
                )

                self.assertEqual(response.status_code, 200)
                self.assert_group(
                    [],
                    task_status=Task.Status.TODO,
                    due_date=selected_date,
                )
                self.assert_group(
                    expected,
                    task_status=Task.Status.DONE,
                    due_date=selected_date,
                )

    def test_move_into_empty_column(self):
        moved = self.make_task("Only task")

        response = self.client.put(
            self.reorder_url,
            self.order_payload(in_progress=[moved.id]),
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assert_group([], task_status=Task.Status.TODO)
        self.assert_group([moved], task_status=Task.Status.IN_PROGRESS)

    def test_empty_board_can_be_reordered(self):
        response = self.client.put(
            self.reorder_url,
            self.order_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {"tasks": []})

    def test_reorder_rejects_malformed_payloads_without_writing(self):
        task = self.make_task("Unchanged")
        valid = self.order_payload(todo=[task.id])
        invalid_payloads = {
            "invalid date": {**valid, "date": "2026-7-12"},
            "missing status": {
                "date": self.board_date.isoformat(),
                "order": {"todo": [task.id], "in_progress": []},
            },
            "extra status": {
                "date": self.board_date.isoformat(),
                "order": {**valid["order"], "archived": []},
            },
            "non-list column": {
                "date": self.board_date.isoformat(),
                "order": {**valid["order"], "todo": "not-a-list"},
            },
            "duplicate ID": self.order_payload(todo=[task.id], done=[task.id]),
            "boolean ID": self.order_payload(todo=[True]),
            "zero ID": self.order_payload(todo=[0]),
            "string ID": self.order_payload(todo=[str(task.id)]),
        }

        for label, payload in invalid_payloads.items():
            with self.subTest(payload=label):
                response = self.client.put(self.reorder_url, payload, format="json")
                self.assertEqual(response.status_code, 400)

        task.refresh_from_db()
        self.assertEqual(task.status, Task.Status.TODO)
        self.assertEqual(task.position, 0)

    def test_stale_missing_foreign_and_wrong_date_ids_return_same_conflict(self):
        task = self.make_task("Owned board task")
        foreign = self.make_task(
            "Private foreign task",
            owner=self.other_user,
        )
        other_date = self.make_task(
            "Other date task",
            due_date=self.board_date + timedelta(days=1),
        )
        payloads = {
            "missing task": self.order_payload(),
            "nonexistent task": self.order_payload(todo=[task.id, 999999]),
            "foreign task": self.order_payload(todo=[task.id, foreign.id]),
            "wrong date": self.order_payload(todo=[task.id, other_date.id]),
        }
        errors = []

        for label, payload in payloads.items():
            with self.subTest(conflict=label):
                response = self.client.put(self.reorder_url, payload, format="json")
                self.assertEqual(response.status_code, 409)
                errors.append(response.data["error"])

        self.assertEqual(len(set(errors)), 1)
        self.assertNotIn("Private foreign task", errors[0])
        task.refresh_from_db()
        self.assertEqual((task.status, task.position), (Task.Status.TODO, 0))

    def test_reorder_requires_authentication(self):
        anonymous_client = APIClient()

        response = anonymous_client.put(
            self.reorder_url,
            self.order_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_reorder_rolls_back_all_changes_when_database_write_fails(self):
        first = self.make_task("First", position=0)
        second = self.make_task("Second", position=1)

        with patch(
            "django.db.models.query.QuerySet.bulk_update",
            side_effect=DatabaseError("simulated write failure"),
        ):
            with self.assertRaises(DatabaseError):
                self.client.put(
                    self.reorder_url,
                    self.order_payload(done=[second.id, first.id]),
                    format="json",
                )

        first.refresh_from_db()
        second.refresh_from_db()
        self.assertEqual((first.status, first.position), (Task.Status.TODO, 0))
        self.assertEqual((second.status, second.position), (Task.Status.TODO, 1))

    def test_create_inserts_at_top_and_ignores_submitted_position(self):
        first = self.make_task("First", position=0)
        second = self.make_task("Second", position=1)

        response = self.client.post(
            self.tasks_url,
            {
                "title": "New task",
                "status": Task.Status.TODO,
                "priority": Task.Priority.HIGH,
                "dueDate": self.board_date.isoformat(),
                "position": 99,
                "tags": ["new"],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        created = Task.objects.get(id=response.data["task"]["id"])
        self.assertEqual(response.data["task"]["position"], 0)
        self.assert_group([created, first, second], task_status=Task.Status.TODO)

    def test_regular_edit_preserves_position(self):
        first = self.make_task("First", position=0)
        edited = self.make_task("Edit me", position=1)

        response = self.client.patch(
            reverse("task-detail", args=[edited.id]),
            {"title": "Edited", "priority": Task.Priority.URGENT, "position": 0},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        edited.refresh_from_db()
        self.assertEqual(edited.position, 1)
        self.assertEqual(edited.title, "Edited")
        self.assert_group([first, edited], task_status=Task.Status.TODO)

    def test_modal_status_and_date_moves_compact_source_and_append_destination(self):
        source_first = self.make_task("Source first", position=0)
        moved = self.make_task("Moved", position=1)
        source_last = self.make_task("Source last", position=2)
        done_first = self.make_task(
            "Done first",
            task_status=Task.Status.DONE,
            position=0,
        )
        done_last = self.make_task(
            "Done last",
            task_status=Task.Status.DONE,
            position=1,
        )

        status_response = self.client.patch(
            reverse("task-detail", args=[moved.id]),
            {"status": Task.Status.DONE},
            format="json",
        )

        self.assertEqual(status_response.status_code, 200)
        self.assert_group(
            [source_first, source_last],
            task_status=Task.Status.TODO,
        )
        self.assert_group(
            [done_first, done_last, moved],
            task_status=Task.Status.DONE,
        )

        destination_date = self.board_date + timedelta(days=1)
        destination_task = self.make_task(
            "Next day",
            task_status=Task.Status.IN_PROGRESS,
            position=0,
            due_date=destination_date,
        )
        date_response = self.client.patch(
            reverse("task-detail", args=[moved.id]),
            {
                "status": Task.Status.IN_PROGRESS,
                "dueDate": destination_date.isoformat(),
            },
            format="json",
        )

        self.assertEqual(date_response.status_code, 200)
        self.assert_group(
            [done_first, done_last],
            task_status=Task.Status.DONE,
        )
        self.assert_group(
            [destination_task, moved],
            task_status=Task.Status.IN_PROGRESS,
            due_date=destination_date,
        )

    def test_delete_compacts_remaining_positions(self):
        first = self.make_task("First", position=0)
        deleted = self.make_task("Delete", position=1)
        last = self.make_task("Last", position=2)

        response = self.client.delete(reverse("task-detail", args=[deleted.id]))

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Task.objects.filter(id=deleted.id).exists())
        self.assert_group([first, last], task_status=Task.Status.TODO)


class TaskPositionMigrationTests(TransactionTestCase):
    migrate_from = [("api", "0001_initial")]
    migrate_to = [("api", "0002_task_position")]

    def setUp(self):
        super().setUp()
        executor = MigrationExecutor(connection)
        executor.migrate(self.migrate_from)
        old_apps = executor.loader.project_state(self.migrate_from).apps
        UserModel = old_apps.get_model("auth", "User")
        OldTask = old_apps.get_model("api", "Task")

        owner = UserModel.objects.create(username="migration-owner")
        older = OldTask.objects.create(
            owner=owner,
            title="Older",
            status="todo",
            priority="medium",
            due_date=date(2026, 7, 12),
            tags=[],
        )
        newer = OldTask.objects.create(
            owner=owner,
            title="Newer",
            status="todo",
            priority="medium",
            due_date=date(2026, 7, 12),
            tags=[],
        )
        now = timezone.now()
        OldTask.objects.filter(id=older.id).update(updated_at=now - timedelta(days=1))
        OldTask.objects.filter(id=newer.id).update(updated_at=now)

        executor = MigrationExecutor(connection)
        executor.migrate(self.migrate_to)
        self.apps = executor.loader.project_state(self.migrate_to).apps

    def tearDown(self):
        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())
        super().tearDown()

    def test_backfill_preserves_previous_updated_at_order(self):
        MigratedTask = self.apps.get_model("api", "Task")

        rows = list(
            MigratedTask.objects.filter(status="todo")
            .order_by("position")
            .values_list("title", "position")
        )

        self.assertEqual(rows, [("Newer", 0), ("Older", 1)])
