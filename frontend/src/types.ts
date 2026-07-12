export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface User {
  id: number;
  email: string;
}

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  position: number;
  priority: TaskPriority;
  dueDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type TaskOrder = Record<TaskStatus, number[]>;

export interface Point {
  x: number;
  y: number;
}

export interface AnnotationPolygon {
  id: number;
  points: Point[];
  color: string;
  label: string;
  createdAt: string;
}

export interface AnnotatedImage {
  id: number;
  url: string;
  originalName: string;
  createdAt: string;
  polygons: AnnotationPolygon[];
}
