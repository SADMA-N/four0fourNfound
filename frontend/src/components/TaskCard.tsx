import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import type { Task } from "../types";
import { taskDndId } from "./boardState";

/* ── Priority badge configuration ──────────────────────────────── */
/*   Symbol is aria-hidden; label text carries the accessible name. */
/*   Background + color use OKLCH with opacity for tinted pills.    */
/*   Contrast verified: all dark-ink variants exceed 4.5:1 on the   */
/*   tinted backgrounds used here.                                   */
const priorityConfig: Record<
  Task["priority"],
  { symbol: string; label: string; bg: string; color: string }
> = {
  urgent: {
    symbol: "◆",
    label: "Urgent",
    bg: "oklch(62% 0.20 20 / 0.10)",
    color: "oklch(38% 0.18 20)",
  },
  high: {
    symbol: "▲",
    label: "High",
    bg: "oklch(74% 0.17 75 / 0.12)",
    color: "oklch(46% 0.15 75)",
  },
  medium: {
    symbol: "●",
    label: "Med",
    bg: "oklch(54% 0.175 255 / 0.10)",
    color: "oklch(36% 0.15 255)",
  },
  low: {
    symbol: "○",
    label: "Low",
    bg: "oklch(55% 0.155 158 / 0.10)",
    color: "oklch(36% 0.13 158)",
  },
};

/* ── Sortable card (drag-enabled) ──────────────────────────────── */
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

/* ── Drag overlay preview (no actions) ─────────────────────────── */
export function TaskCardPreview({ task }: { task: Task }) {
  return <TaskCardBody task={task} overlay />;
}

/* ── Shared card body ──────────────────────────────────────────── */
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
} & ComponentPropsWithoutRef<"article">) {
  const priority = priorityConfig[task.priority];

  return (
    <article
      {...articleProps}
      ref={nodeRef}
      className={`
        relative bg-surface border border-line rounded-[8px] shadow-card
        grid gap-[10px] p-[14px]
        transition-opacity duration-[130ms]
        ${dragging ? "opacity-30" : "opacity-100"}
        ${overlay ? "cursor-grabbing shadow-app" : ""}
      `}
    >
      {/* Corner registration mark — restrained drafting motif, one per card */}
      <span
        className="mono absolute top-[7px] right-[8px] text-[0.6rem] leading-none select-none pointer-events-none"
        style={{ color: "var(--color-line)" }}
        aria-hidden="true"
      >
        +
      </span>

      {/* ── Row: drag handle · priority badge · edit/delete ─────── */}
      <div className="flex items-center gap-[8px]">

        {/* Drag handle — keyboard accessible, touch-friendly */}
        <button
          ref={handleRef}
          type="button"
          className={`
            inline-flex items-center justify-center
            bg-transparent border-0 p-0 shrink-0 text-muted touch-none
            ${disabled ? "cursor-not-allowed" : "cursor-grab"}
          `}
          aria-label={`Drag to reorder: ${task.title}`}
          disabled={disabled || overlay}
          {...handleProps}
        >
          <GripVertical size={16} aria-hidden="true" />
        </button>

        {/* Priority badge — symbol is decorative; label is the accessible text */}
        <span
          className="inline-flex items-center gap-[4px] px-[7px] py-[3px] rounded-[4px] text-[0.7rem] font-bold leading-none"
          style={{ background: priority.bg, color: priority.color }}
        >
          <span aria-hidden="true">{priority.symbol}</span>
          <span>{priority.label}</span>
        </span>

        {/* Edit and delete — always visible (no hover-only) */}
        {!overlay && (
          <div className="inline-flex gap-[5px] ml-auto">
            <button
              className="btn-mini"
              type="button"
              onClick={() => onEdit?.(task)}
              aria-label={`Edit: ${task.title}`}
              title="Edit task"
              disabled={disabled}
            >
              <Pencil size={14} aria-hidden="true" />
            </button>
            <button
              className="btn-mini text-coral"
              type="button"
              onClick={() => onDelete?.(task)}
              aria-label={`Delete: ${task.title}`}
              title="Delete task"
              disabled={disabled}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* ── Title ───────────────────────────────────────────────── */}
      <h3 className="text-[0.9rem] font-medium text-ink leading-snug m-0 break-words">
        {task.title}
      </h3>

      {/* ── Tags ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-[5px]">
        {task.tags.length ? (
          task.tags.map((tag) => (
            <span
              key={tag}
              className="bg-surface-2 border border-line rounded-[4px] text-muted text-[0.7rem] font-semibold px-[6px] py-[2px]"
            >
              {tag}
            </span>
          ))
        ) : (
          <span
            className="bg-surface-2 border border-line rounded-[4px] text-muted text-[0.7rem] font-semibold px-[6px] py-[2px]"
            style={{ opacity: 0.5 }}
          >
            untagged
          </span>
        )}
      </div>
    </article>
  );
}
