from django.db import migrations, models


def backfill_task_positions(apps, schema_editor):
    Task = apps.get_model("api", "Task")
    tasks = Task.objects.order_by(
        "owner_id",
        "due_date",
        "status",
        "-updated_at",
        "id",
    )

    current_scope = None
    position = 0
    pending = []
    for task in tasks.iterator():
        scope = (task.owner_id, task.due_date, task.status)
        if scope != current_scope:
            current_scope = scope
            position = 0
        task.position = position
        pending.append(task)
        position += 1

    if pending:
        Task.objects.bulk_update(pending, ["position"])


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="position",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.RunPython(backfill_task_positions, migrations.RunPython.noop),
        migrations.AlterModelOptions(
            name="task",
            options={"ordering": ["due_date", "status", "position", "id"]},
        ),
        migrations.AddIndex(
            model_name="task",
            index=models.Index(
                fields=["owner", "due_date", "status", "position"],
                name="api_task_board_pos_idx",
            ),
        ),
    ]
