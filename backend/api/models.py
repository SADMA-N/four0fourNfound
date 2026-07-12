from django.conf import settings
from django.db import models


class Task(models.Model):
    class Status(models.TextChoices):
        TODO = "todo", "To Do"
        IN_PROGRESS = "in_progress", "In Progress"
        DONE = "done", "Done"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=160)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    due_date = models.DateField()
    position = models.PositiveIntegerField(default=0)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_date", "status", "position", "id"]
        indexes = [
            models.Index(
                fields=["owner", "due_date", "status", "position"],
                name="api_task_board_pos_idx",
            ),
        ]

    def __str__(self) -> str:
        return self.title


class AnnotatedImage(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="annotated_images")
    image = models.FileField(upload_to="uploads/")
    original_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.original_name


class AnnotationPolygon(models.Model):
    image = models.ForeignKey(AnnotatedImage, on_delete=models.CASCADE, related_name="polygons")
    points = models.JSONField(default=list)
    color = models.CharField(max_length=16, default="#0f8b8d")
    label = models.CharField(max_length=80, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.image_id}:{len(self.points)} points"
