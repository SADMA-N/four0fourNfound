import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import type { Task } from "../types";

const priorityLabels: Record<Task["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const priorityBorder: Record<Task["priority"], string> = {
  low: "border-l-green",
  medium: "border-l-blue",
  high: "border-l-amber",
  urgent: "border-l-coral",
};

export function TaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 100 }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-line border-l-[5px] ${priorityBorder[task.priority]} rounded-lg shadow-card grid gap-3 min-h-[138px] p-[13px] transition-opacity ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="flex items-center gap-2">
        <GripVertical
          className="text-muted cursor-grab shrink-0"
          size={18}
          aria-hidden="true"
          {...attributes}
          {...listeners}
        />
        <span className="bg-surface-2 rounded-[6px] text-muted text-[0.75rem] font-black px-[7px] py-1">
          {priorityLabels[task.priority]}
        </span>
        <div className="inline-flex gap-[6px] ml-auto">
          <button
            className="btn-mini"
            type="button"
            onClick={() => onEdit(task)}
            title="Edit task"
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            className="btn-mini text-coral"
            type="button"
            onClick={() => onDelete(task)}
            title="Delete task"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <h3 className="text-[0.98rem] leading-snug m-0 break-all">{task.title}</h3>

      <div className="flex flex-wrap gap-[6px]">
        {task.tags.length ? (
          task.tags.map((tag) => (
            <span
              key={tag}
              className="bg-[#f9fbfc] border border-line rounded-[6px] text-muted text-[0.74rem] font-extrabold px-[7px] py-1"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="bg-[#f9fbfc] border border-line rounded-[6px] text-muted text-[0.74rem] font-extrabold px-[7px] py-1">
            untagged
          </span>
        )}
      </div>
    </article>
  );
}
