import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import type { Task } from "../types";
import { taskDndId } from "./boardState";

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
  disabled = false,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: taskDndId(task.id),
    data: { type: "task", status: task.status, taskId: task.id },
    disabled,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <TaskCardBody
      nodeRef={setNodeRef}
      style={style}
      task={task}
      onEdit={onEdit}
      onDelete={onDelete}
      disabled={disabled}
      dragging={isDragging}
      handleRef={setActivatorNodeRef}
      handleProps={{ ...attributes, ...listeners }}
    />
  );
}

export function TaskCardPreview({ task }: { task: Task }) {
  return <TaskCardBody task={task} overlay />;
}

function TaskCardBody({
  task,
  onEdit,
  onDelete,
  disabled = false,
  dragging = false,
  overlay = false,
  handleRef,
  handleProps,
  nodeRef,
  ...articleProps
}: {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  disabled?: boolean;
  dragging?: boolean;
  overlay?: boolean;
  handleRef?: (element: HTMLElement | null) => void;
  handleProps?: Record<string, unknown>;
  nodeRef?: (element: HTMLElement | null) => void;
} & React.ComponentPropsWithoutRef<"article">) {
  return (
    <article
      {...articleProps}
      ref={nodeRef}
      className={`bg-white border border-line border-l-[5px] ${priorityBorder[task.priority]} rounded-lg shadow-card grid gap-3 min-h-[138px] p-[13px] transition-opacity ${
        dragging ? "opacity-25" : "opacity-100"
      } ${overlay ? "cursor-grabbing shadow-app" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button
          ref={handleRef}
          type="button"
          className={`inline-flex items-center justify-center bg-transparent border-0 text-muted shrink-0 p-0 touch-none ${
            disabled ? "cursor-not-allowed" : "cursor-grab"
          }`}
          aria-label={`Drag ${task.title}`}
          disabled={disabled || overlay}
          {...handleProps}
        >
          <GripVertical size={18} aria-hidden="true" />
        </button>
        <span className="bg-surface-2 rounded-[6px] text-muted text-[0.75rem] font-black px-[7px] py-1">
          {priorityLabels[task.priority]}
        </span>
        {!overlay ? <div className="inline-flex gap-[6px] ml-auto">
          <button
            className="btn-mini"
            type="button"
            onClick={() => onEdit?.(task)}
            title="Edit task"
            disabled={disabled}
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            className="btn-mini text-coral"
            type="button"
            onClick={() => onDelete?.(task)}
            title="Delete task"
            disabled={disabled}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div> : null}
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
