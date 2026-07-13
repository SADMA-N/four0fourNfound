import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "../types";
import { columnDndId, taskDndId } from "./boardState";
import { TaskCard } from "./TaskCard";

export function Column({
  title,
  zone,
  status,
  tasks,
  onEdit,
  onDelete,
  disabled = false,
}: {
  title: string;
  zone: number;
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  disabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDndId(status),
    data: { type: "column", status },
    disabled,
  });

  const zoneLabel = `ZONE ${String(zone).padStart(2, "0")}`;

  return (
    <section
      ref={setNodeRef}
      className={`workspace-bg grid gap-[14px] min-h-[560px] p-[14px] rounded-lg border transition-colors ${
        isOver ? "border-teal" : "border-line"
      }`}
      style={{ gridTemplateRows: "auto 1fr" }}
      aria-label={`${title} column`}
    >
      {/* ── Zone header ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between">
        <div>
          {/* Monospace zone number — technical identity, not decorative */}
          <span
            className="mono block text-[0.67rem] text-muted tracking-[0.1em] leading-none mb-[5px]"
            aria-hidden="true"
          >
            {zoneLabel}
          </span>
          <h2 className="text-[0.9rem] font-semibold text-ink m-0 leading-none">
            {title}
          </h2>
        </div>
        <span
          className="mono text-[0.8rem] text-muted font-medium"
          aria-label={`${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`}
        >
          {tasks.length}
        </span>
      </header>

      {/* ── Card list ───────────────────────────────────────────── */}
      <SortableContext
        items={tasks.map((task) => taskDndId(task.id))}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <div className="grid gap-3 content-start">
          {tasks.length ? (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                disabled={disabled}
              />
            ))
          ) : (
            <div className="flex items-center justify-center border border-dashed border-line rounded-lg text-muted text-[0.82rem] min-h-[90px] p-4 text-center">
              Drop a task here
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
