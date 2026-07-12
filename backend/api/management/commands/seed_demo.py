from datetime import date, timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import Task


class Command(BaseCommand):
    help = "Create the demo login and a few starter tasks."

    def handle(self, *args, **options):
        email = "demo@pronfou.test"
        password = "demo12345"
        user, created = User.objects.get_or_create(username=email, defaults={"email": email})
        user.email = email
        user.set_password(password)
        user.save()

        today = date.today()
        samples = [
            {
                "title": "Prepare recruiter-ready Kanban flow",
                "status": Task.Status.TODO,
                "priority": Task.Priority.HIGH,
                "due_date": today,
                "tags": ["frontend", "ux"],
            },
            {
                "title": "Wire annotation polygons to the database",
                "status": Task.Status.IN_PROGRESS,
                "priority": Task.Priority.URGENT,
                "due_date": today,
                "tags": ["backend", "annotations"],
            },
            {
                "title": "Record the two-minute product walkthrough",
                "status": Task.Status.DONE,
                "priority": Task.Priority.MEDIUM,
                "due_date": today + timedelta(days=1),
                "tags": ["demo"],
            },
        ]

        with transaction.atomic():
            User.objects.select_for_update().get(id=user.id)
            for sample in samples:
                Task.objects.update_or_create(
                    owner=user,
                    title=sample["title"],
                    defaults=sample,
                )

            tasks = list(
                Task.objects.select_for_update()
                .filter(owner=user)
                .order_by("due_date", "status", "position", "id")
            )
            current_scope = None
            position = 0
            changed = []
            for task in tasks:
                scope = (task.due_date, task.status)
                if scope != current_scope:
                    current_scope = scope
                    position = 0
                if task.position != position:
                    task.position = position
                    changed.append(task)
                position += 1
            if changed:
                Task.objects.bulk_update(changed, ["position"])

        state = "created" if created else "updated"
        self.stdout.write(self.style.SUCCESS(f"Demo user {state}: {email} / {password}"))
