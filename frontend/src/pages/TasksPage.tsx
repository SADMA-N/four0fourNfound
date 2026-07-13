import { Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../api";
import { Board } from "../components/Board";
import { toTaskOrder } from "../components/boardState";
import { DateSelector } from "../components/DateSelector";
import { TaskModal } from "../components/TaskModal";
import { useSelectedDate } from "../context/DateContext";
import type { Task, TaskPriority, TaskStatus } from "../types";

export function TasksPage() {
  const { selectedDate } = useSelectedDate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reorderPending, setReorderPending] = useState(false);
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.listTasks(selectedDate);
      setTasks(response.tasks);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to load tasks.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const taskCountLabel = useMemo(
    () => `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`,
    [tasks.length],
  );

  const saveTask = async (input: {
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    tags: string[];
  }) => {
    if (reorderPending) return;
    setSaving(true);
    setError("");
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, input);
      } else {
        await api.createTask(input);
      }
      setModalOpen(false);
      setEditingTask(null);

      try {
        const response = await api.listTasks(selectedDate);
        setTasks(response.tasks);
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? `Task saved, but the board could not be refreshed: ${nextError.message}`
            : "Task saved, but the board could not be refreshed.",
        );
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Unable to save task.",
      );
    } finally {
      setSaving(false);
    }
  };

  const reorderTasks = async (
    nextTasks: Task[],
    previousTasks: Task[],
  ) => {
    setReorderPending(true);
    setError("");
    setTasks(nextTasks);

    try {
      const response = await api.reorderTasks(
        selectedDate,
        toTaskOrder(nextTasks),
      );
      // The server response is authoritative, including normalized positions.
      setTasks(response.tasks);
    } catch (nextError) {
      if (nextError instanceof ApiError && nextError.status === 409) {
        try {
          const response = await api.listTasks(selectedDate);
          setTasks(response.tasks);
          setError(
            "The board changed before your move was saved. The latest tasks have been loaded.",
          );
        } catch (refreshError) {
          setError(
            refreshError instanceof Error
              ? `The board changed and the latest tasks could not be loaded: ${refreshError.message}`
              : "The board changed and the latest tasks could not be loaded.",
          );
        }
      } else {
        setTasks(previousTasks);
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to reorder tasks.",
        );
      }
    } finally {
      setReorderPending(false);
    }
  };

  const deleteTask = async (task: Task) => {
    if (reorderPending) return;
    const previousTasks = tasks;
    setError("");
    setTasks(previousTasks.filter((item) => item.id !== task.id));
    try {
      await api.deleteTask(task.id);

      try {
        const response = await api.listTasks(selectedDate);
        setTasks(response.tasks);
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? `Task deleted, but the board could not be refreshed: ${nextError.message}`
            : "Task deleted, but the board could not be refreshed.",
        );
      }
    } catch (nextError) {
      setTasks(previousTasks);
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to delete task.",
      );
    }
  };

  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[1.05rem] font-semibold text-ink m-0 leading-none">
            Task Board
          </h1>
          <span className="mono text-[0.78rem] text-muted" aria-live="polite">
            {taskCountLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-[10px] justify-end">
          <DateSelector disabled={reorderPending} />
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
            disabled={reorderPending}
          >
            <Plus size={17} aria-hidden="true" />
            <span>Add task</span>
          </button>
        </div>
      </header>

      {error ? <div className="page-error">{error}</div> : null}

      {loading ? (
        <div className="flex items-center justify-center min-h-[280px]">
          <Loader2 className="spin" aria-hidden="true" />
        </div>
      ) : (
        <Board
          tasks={tasks}
          disabled={reorderPending}
          onTasksChange={setTasks}
          onReorderTasks={reorderTasks}
          onEditTask={(task) => {
            setEditingTask(task);
            setModalOpen(true);
          }}
          onDeleteTask={deleteTask}
        />
      )}

      <TaskModal
        open={modalOpen}
        task={editingTask}
        defaultDate={selectedDate}
        saving={saving}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={saveTask}
      />
    </section>
  );
}
