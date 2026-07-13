import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Task, TaskPriority, TaskStatus } from "../types";

interface TaskModalProps {
  open: boolean;
  task: Task | null;
  defaultDate: string;
  saving: boolean;
  onClose: () => void;
  onSave: (input: {
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    tags: string[];
  }) => Promise<void>;
}

export function TaskModal({
  open,
  task,
  defaultDate,
  saving,
  onClose,
  onSave,
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState(defaultDate);
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setStatus(task?.status ?? "todo");
    setPriority(task?.priority ?? "medium");
    setDueDate(task?.dueDate ?? defaultDate);
    setTags(task?.tags.join(", ") ?? "");
  }, [defaultDate, open, task]);

  if (!open) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave({
      title,
      status,
      priority,
      dueDate,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  const mode = task ? "EDIT" : "NEW";

  return (
    /* ── Backdrop ───────────────────────────────────────────────── */
    <div
      className="fixed inset-0 flex items-center justify-center p-5 z-10"
      style={{ background: "oklch(22% 0.04 258 / 0.46)" }}
      role="presentation"
      onMouseDown={onClose}
    >
      {/* ── Modal panel ─────────────────────────────────────────── */}
      <div
        className="bg-surface border border-line rounded-lg shadow-app w-full max-w-[520px] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={task ? "Edit task" : "Add task"}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* ── Title block — top teal accent strip ─────────────────── */}
        {/* The 2 px top border connects this modal to the teal action  */}
        {/* identity used throughout the board without adding clutter.  */}
        <header
          className="flex items-start justify-between gap-4 border-b border-line px-5 pt-[14px] pb-[13px]"
          style={{ borderTop: "2px solid var(--color-teal)" }}
        >
          <div>
            {/* Monospace eyebrow — restrained technical identity */}
            <span
              className="mono block text-[0.65rem] leading-none tracking-[0.12em] text-muted mb-[6px] select-none"
              aria-hidden="true"
            >
              TASK — {mode}
            </span>
            <h2 className="text-[0.95rem] font-semibold text-ink m-0 leading-none">
              {task ? "Edit task" : "Add task"}
            </h2>
          </div>
          <button
            className="btn-icon shrink-0"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        {/* ── Form body ─────────────────────────────────────────── */}
        <form className="grid gap-4 p-5" onSubmit={submit}>

          {/* Title */}
          <label>
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={160}
              autoFocus
              placeholder="What needs to be done?"
            />
          </label>

          {/* Status + Priority row */}
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}
          >
            <label>
              <span>Status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as TaskStatus)
                }
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>
            <label>
              <span>Priority</span>
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>

          {/* Due date — monospace styling applied to input */}
          <label>
            <span>Due date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
              className="mono"
            />
          </label>

          {/* Tags */}
          <label>
            <span>Tags</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="frontend, backend"
            />
          </label>

          {/* ── Footer ──────────────────────────────────────────── */}
          <footer className="flex gap-[10px] justify-end pt-1">
            <button
              className="btn-ghost"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button className="btn-primary" type="submit" disabled={saving}>
              <Save size={16} aria-hidden="true" />
              <span>{saving ? "Saving…" : "Save task"}</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
