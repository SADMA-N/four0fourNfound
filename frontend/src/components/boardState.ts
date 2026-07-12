import type { Task, TaskOrder, TaskStatus } from "../types";

export const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];

export interface TaskPlacement {
  status: TaskStatus;
  index: number;
}

export function taskDndId(taskId: number): string {
  return `task:${taskId}`;
}

export function columnDndId(status: TaskStatus): string {
  return `column:${status}`;
}

export function parseTaskDndId(id: string | number): number | null {
  if (typeof id !== "string" || !id.startsWith("task:")) return null;
  const taskId = Number(id.slice(5));
  return Number.isSafeInteger(taskId) && taskId > 0 ? taskId : null;
}

export function taskPlacement(
  tasks: Task[],
  taskId: number,
): TaskPlacement | null {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return null;

  const index = tasks
    .filter((item) => item.status === task.status)
    .findIndex((item) => item.id === taskId);

  return index < 0 ? null : { status: task.status, index };
}

export function samePlacement(
  left: TaskPlacement | null,
  right: TaskPlacement | null,
): boolean {
  return left?.status === right?.status && left?.index === right?.index;
}

export function sameBoardOrder(left: Task[], right: Task[]): boolean {
  if (left.length !== right.length) return false;

  return TASK_STATUSES.every((status) => {
    const leftIds = left
      .filter((task) => task.status === status)
      .map((task) => task.id);
    const rightIds = right
      .filter((task) => task.status === status)
      .map((task) => task.id);

    return (
      leftIds.length === rightIds.length &&
      leftIds.every((id, index) => id === rightIds[index])
    );
  });
}

export function relocateTask(
  tasks: Task[],
  taskId: number,
  destinationStatus: TaskStatus,
  destinationIndex: number,
): Task[] {
  const activeTask = tasks.find((task) => task.id === taskId);
  if (!activeTask || new Set(tasks.map((task) => task.id)).size !== tasks.length) {
    return tasks;
  }

  const groups: Record<TaskStatus, Task[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };

  for (const task of tasks) {
    if (task.id !== taskId) groups[task.status].push(task);
  }

  const target = groups[destinationStatus];
  const boundedIndex = Math.max(0, Math.min(destinationIndex, target.length));
  target.splice(boundedIndex, 0, activeTask);

  const nextTasks = TASK_STATUSES.flatMap((status) =>
    groups[status].map((task, position) =>
      task.status === status && task.position === position
        ? task
        : { ...task, status, position },
    ),
  );

  if (
    nextTasks.length !== tasks.length ||
    new Set(nextTasks.map((task) => task.id)).size !== tasks.length
  ) {
    return tasks;
  }

  return sameBoardOrder(tasks, nextTasks) ? tasks : nextTasks;
}

export function toTaskOrder(tasks: Task[]): TaskOrder {
  return {
    todo: tasks
      .filter((task) => task.status === "todo")
      .map((task) => task.id),
    in_progress: tasks
      .filter((task) => task.status === "in_progress")
      .map((task) => task.id),
    done: tasks
      .filter((task) => task.status === "done")
      .map((task) => task.id),
  };
}
