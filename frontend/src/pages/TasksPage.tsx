import { Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Board } from "../components/Board";
import { DateSelector } from "../components/DateSelector";
import { TaskModal } from "../components/TaskModal";
import { useSelectedDate } from "../context/DateContext";
import type { Task, TaskPriority, TaskStatus } from "../types";

export function TasksPage() {
  const { selectedDate } = useSelectedDate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    setSaving(true);
    try {
      if (editingTask) {
        const response = await api.updateTask(editingTask.id, input);
        setTasks((current) =>
          current.map((task) =>
            task.id === editingTask.id ? response.task : task,
          ),
        );
      } else {
        const response = await api.createTask(input);
        setTasks((current) =>
          response.task.dueDate === selectedDate
            ? [response.task, ...current]
            : current,
        );
      }
      setModalOpen(false);
      setEditingTask(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Unable to save task.",
      );
    } finally {
      setSaving(false);
    }
  };

  const moveTask = async (taskId: number, nextStatus: TaskStatus) => {
    const previousTasks = tasks;
    const target = tasks.find((task) => task.id === taskId);
    if (!target || target.status === nextStatus) return;
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, status: nextStatus } : task,
      ),
    );
    try {
      await api.updateTask(taskId, { status: nextStatus });
    } catch (nextError) {
      setTasks(previousTasks);
      setError(
        nextError instanceof Error ? nextError.message : "Unable to move task.",
      );
    }
  };

  const deleteTask = async (task: Task) => {
    setTasks((current) => current.filter((item) => item.id !== task.id));
    try {
      await api.deleteTask(task.id);
    } catch (nextError) {
      setTasks((current) => [...current, task]);
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to delete task.",
      );
    }
  };

  return (
    <section className="grid gap-5">
      <header className="flex items-end justify-between gap-[18px]">
        <div>
          <span className="block text-teal text-[0.78rem] font-black uppercase mb-[10px] tracking-tight">
            Task page
          </span>
          <h1 className="text-[clamp(2rem,4vw,4rem)] leading-none tracking-tight m-0">
            Nobody does the task
          </h1>
          <p className="text-muted mt-2 mb-0">
            {taskCountLabel} for the selected day
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-[10px] justify-end">
          <DateSelector />
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
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
          onMoveTask={moveTask}
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
