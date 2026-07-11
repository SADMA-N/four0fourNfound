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

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-5 z-10"
      style={{ background: "rgba(23,32,42,0.42)" }}
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="bg-white border border-line rounded-lg shadow-app w-full max-w-[520px] p-5"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between mb-[18px]">
          <h2 className="text-[1rem] m-0">{task ? "Edit task" : "Add task"}</h2>
          <button
            className="btn-icon"
            type="button"
            onClick={onClose}
            title="Close"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form className="grid gap-4" onSubmit={submit}>
          <label>
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={160}
              autoFocus
            />
          </label>

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

          <label>
            <span>Due date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
            />
          </label>

          <label>
            <span>Tags</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="frontend, backend"
            />
          </label>

          <footer className="flex gap-[10px] justify-end mt-2">
            <button className="btn-ghost" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" type="submit" disabled={saving}>
              <Save size={17} aria-hidden="true" />
              <span>{saving ? "Saving" : "Save task"}</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
