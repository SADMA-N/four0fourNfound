import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  CollisionDetection,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  Over,
} from "@dnd-kit/core";
import { useCallback, useRef, useState } from "react";
import type { Task, TaskStatus } from "../types";
import {
  parseTaskDndId,
  relocateTask,
  sameBoardOrder,
  samePlacement,
  taskPlacement,
} from "./boardState";
import { Column } from "./Column";
import { TaskCardPreview } from "./TaskCard";

const columns: Array<{ title: string; status: TaskStatus; zone: number }> = [
  { title: "To Do", status: "todo", zone: 1 },
  { title: "In Progress", status: "in_progress", zone: 2 },
  { title: "Done", status: "done", zone: 3 },
];

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === "todo" || value === "in_progress" || value === "done";
}

function copyBoard(tasks: Task[]): Task[] {
  return tasks.map((task) => ({ ...task, tags: [...task.tags] }));
}

function destinationForOver(
  over: Over,
  tasks: Task[],
  activeTaskId: number,
  pointerY: number | null,
) {
  const status = over.data.current?.status;
  if (!isTaskStatus(status)) return null;

  const destinationTasks = tasks.filter(
    (task) => task.status === status && task.id !== activeTaskId,
  );

  if (over.data.current?.type === "column") {
    return { status, index: destinationTasks.length ? destinationTasks.length : 0 };
  }

  const overTaskId = over.data.current?.taskId;
  if (typeof overTaskId !== "number") return null;

  const overIndex = destinationTasks.findIndex(
    (task) => task.id === overTaskId,
  );
  if (overIndex < 0) return null;

  const midpoint = over.rect.top + over.rect.height / 2;
  const insertAfter = pointerY !== null && pointerY >= midpoint;
  return { status, index: overIndex + (insertAfter ? 1 : 0) };
}

export function Board({
  tasks,
  disabled = false,
  onTasksChange,
  onReorderTasks,
  onEditTask,
  onDeleteTask,
}: {
  tasks: Task[];
  disabled?: boolean;
  onTasksChange: (tasks: Task[]) => void;
  onReorderTasks: (tasks: Task[], previousTasks: Task[]) => Promise<void>;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [committing, setCommitting] = useState(false);
  const tasksRef = useRef(tasks);
  const originalBoardRef = useRef<Task[] | null>(null);
  const activeTaskIdRef = useRef<number | null>(null);
  const pointerYRef = useRef<number | null>(null);
  const lastPlacementRef = useRef<ReturnType<typeof taskPlacement>>(null);

  // Drag events can arrive before React commits the preview render. Keep this
  // ref synchronous so each event operates on the latest board exactly once.
  tasksRef.current = tasks;

  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointer = args.pointerCoordinates;
    if (!pointer) return [];
    pointerYRef.current = pointer.y;

    const column = args.droppableContainers.find((container) => {
      if (container.data.current?.type !== "column") return false;
      const rect = args.droppableRects.get(container.id);
      return Boolean(
        rect &&
          pointer.x >= rect.left &&
          pointer.x <= rect.right &&
          pointer.y >= rect.top &&
          pointer.y <= rect.bottom,
      );
    });

    if (!column) return [];
    const status = column.data.current?.status;
    const activeId = args.active.id;

    const taskContainers = args.droppableContainers.filter(
      (container) =>
        container.id !== activeId &&
        container.data.current?.type === "task" &&
        container.data.current?.status === status &&
        args.droppableRects.has(container.id),
    );

    if (!taskContainers.length) {
      return [
        {
          id: column.id,
          data: { droppableContainer: column, value: 0 },
        },
      ];
    }

    let closest = taskContainers[0];
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const container of taskContainers) {
      const rect = args.droppableRects.get(container.id);
      if (!rect) continue;
      const distance = Math.abs(pointer.y - (rect.top + rect.height / 2));
      if (distance < closestDistance) {
        closest = container;
        closestDistance = distance;
      }
    }

    return [
      {
        id: closest.id,
        data: {
          droppableContainer: closest,
          value: closestDistance,
        },
      },
    ];
  }, []);

  const resetDrag = () => {
    originalBoardRef.current = null;
    activeTaskIdRef.current = null;
    pointerYRef.current = null;
    lastPlacementRef.current = null;
    setActiveTask(null);
  };

  const restoreOriginalBoard = () => {
    const originalBoard = originalBoardRef.current;
    if (originalBoard) {
      tasksRef.current = originalBoard;
      onTasksChange(originalBoard);
    }
    resetDrag();
  };

  const previewOver = (over: Over): Task[] => {
    const activeTaskId = activeTaskIdRef.current;
    const currentTasks = tasksRef.current;
    if (activeTaskId === null) return currentTasks;

    const destination = destinationForOver(
      over,
      currentTasks,
      activeTaskId,
      pointerYRef.current,
    );
    if (!destination) return currentTasks;

    const currentPlacement = taskPlacement(currentTasks, activeTaskId);
    if (
      samePlacement(currentPlacement, destination) &&
      samePlacement(lastPlacementRef.current, destination)
    ) {
      return currentTasks;
    }

    const nextTasks = relocateTask(
      currentTasks,
      activeTaskId,
      destination.status,
      destination.index,
    );
    const nextPlacement = taskPlacement(nextTasks, activeTaskId);
    lastPlacementRef.current = nextPlacement;

    if (nextTasks !== currentTasks) {
      tasksRef.current = nextTasks;
      onTasksChange(nextTasks);
    }

    return nextTasks;
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (disabled || committing) return;
    const taskId = parseTaskDndId(event.active.id);
    const task = taskId === null
      ? undefined
      : tasksRef.current.find((item) => item.id === taskId);
    if (!task || taskId === null) return;

    const originalBoard = copyBoard(tasksRef.current);
    originalBoardRef.current = originalBoard;
    activeTaskIdRef.current = taskId;
    lastPlacementRef.current = taskPlacement(originalBoard, taskId);
    pointerYRef.current =
      event.activatorEvent instanceof PointerEvent
        ? event.activatorEvent.clientY
        : null;
    setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!originalBoardRef.current || !event.over) return;
    previewOver(event.over);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const originalBoard = originalBoardRef.current;
    if (!originalBoard) {
      resetDrag();
      return;
    }

    if (!event.over) {
      restoreOriginalBoard();
      return;
    }

    const nextTasks = previewOver(event.over);
    if (sameBoardOrder(originalBoard, nextTasks)) {
      tasksRef.current = originalBoard;
      onTasksChange(originalBoard);
      resetDrag();
      return;
    }

    resetDrag();
    setCommitting(true);
    try {
      await onReorderTasks(nextTasks, originalBoard);
    } finally {
      setCommitting(false);
    }
  };

  const interactionsDisabled = disabled || committing;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={restoreOriginalBoard}
      onDragEnd={handleDragEnd}
    >
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(3, minmax(250px, 1fr))" }}
        aria-busy={interactionsDisabled}
      >
        {columns.map((column) => (
          <Column
            key={column.status}
            title={column.title}
            zone={column.zone}
            status={column.status}
            tasks={tasks.filter((task) => task.status === column.status)}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            disabled={interactionsDisabled}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCardPreview task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
