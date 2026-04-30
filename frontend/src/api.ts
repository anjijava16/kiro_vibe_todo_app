import type { Task, Category, Priority, Comment, TaskFormData } from "./types";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// Tasks
export const getTasks = () => request<Task[]>("/tasks");
export const getTask = (id: number) => request<Task>(`/tasks/${id}`);
export const createTask = (data: TaskFormData) =>
  request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) });
export const updateTask = (id: number, data: Partial<TaskFormData>) =>
  request<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteTask = (id: number) =>
  request<{ message: string }>(`/tasks/${id}`, { method: "DELETE" });

// Comments
export const getComments = (taskId: number) =>
  request<Comment[]>(`/tasks/${taskId}/comments`);
export const addComment = (taskId: number, text: string, author?: string) =>
  request<Comment>(`/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text, author }),
  });
export const deleteComment = (id: number) =>
  request<{ message: string }>(`/comments/${id}`, { method: "DELETE" });

// Lookups
export const getCategories = () => request<Category[]>("/categories");
export const getPriorities = () => request<Priority[]>("/priorities");
