import { useDroppable } from "@dnd-kit/core";
import type { Task, TaskStatus } from "../types";
import { TaskCard } from "./TaskCard";

export function Column({
  title,
  status,
  tasks,
  onEdit,
  onDelete,
}: {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={`border rounded-lg grid gap-[14px] min-h-[560px] p-[14px] transition-colors ${
        isOver ? "bg-teal/10 border-teal" : "bg-surface-2 border-line"
      }`}
      style={{ gridTemplateRows: "auto 1fr" }}
    >
      <header className="flex items-center justify-between">
        <h2 className="text-[1rem] m-0">{title}</h2>
        <span className="inline-flex items-center justify-center bg-white border border-line rounded-lg text-muted text-[0.82rem] font-black h-[30px] min-w-[32px]">
          {tasks.length}
        </span>
      </header>

      <div className="grid gap-3 content-start">
        {tasks.length ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="flex items-center justify-center border border-dashed border-[#bdcbd5] rounded-lg text-muted text-[0.9rem] font-extrabold min-h-[90px] p-[18px] text-center">
            No tasks
          </div>
        )}
      </div>
    </section>
  );
}
