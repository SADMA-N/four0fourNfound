import type {
  AnnotatedImage,
  AnnotationPolygon,
  Point,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";
const TOKEN_KEY = "pronfou_token";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const body = options.body;

  if (!(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getStoredToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("Content-Type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message =
      typeof data?.error === "string" ? data.error : "Request failed.";
    throw new ApiError(message, response.status, data?.details);
  }

  return data as T;
}

export const api = {
  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: User }> {
    return request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async signup(
    email: string,
    password: string,
  ): Promise<{ token: string; user: User }> {
    return request("/auth/signup/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async me(): Promise<{ user: User }> {
    return request("/auth/me/");
  },

  async listTasks(date: string): Promise<{ tasks: Task[] }> {
    return request(`/tasks/?date=${encodeURIComponent(date)}`);
  },

  async createTask(input: {
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    tags: string[];
  }): Promise<{ task: Task }> {
    return request("/tasks/", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateTask(
    id: number,
    input: Partial<{
      title: string;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate: string;
      tags: string[];
    }>,
  ): Promise<{ task: Task }> {
    return request(`/tasks/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteTask(id: number): Promise<{ deleted: boolean }> {
    return request(`/tasks/${id}/`, { method: "DELETE" });
  },

  async listImages(): Promise<{ images: AnnotatedImage[] }> {
    return request("/images/");
  },

  async uploadImages(files: File[]): Promise<{ images: AnnotatedImage[] }> {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    return request("/images/", {
      method: "POST",
      body: formData,
    });
  },

  async deleteImage(id: number): Promise<{ deleted: boolean }> {
    return request(`/images/${id}/`, { method: "DELETE" });
  },

  async createPolygon(
    imageId: number,
    input: { points: Point[]; label: string; color: string },
  ): Promise<{ polygon: AnnotationPolygon }> {
    return request(`/images/${imageId}/polygons/`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async deletePolygon(id: number): Promise<{ deleted: boolean }> {
    return request(`/polygons/${id}/`, { method: "DELETE" });
  },
};
