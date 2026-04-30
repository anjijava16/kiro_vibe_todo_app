import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Task, Category, Priority, TaskFormData } from "./types";
import * as api from "./api";
import TaskCard from "./components/TaskCard";
import TaskFormModal from "./components/TaskFormModal";
import TaskDetailModal from "./components/TaskDetailModal";
import ConfirmDialog from "./components/ConfirmDialog";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; task: Task }
  | { type: "detail"; task: Task }
  | { type: "confirm-delete"; task: Task };

const COLUMNS: { key: Task["status"]; label: string; className: string }[] = [
  { key: "todo", label: "📋 To Do", className: "col-todo" },
  { key: "in-progress", label: "🔄 In Progress", className: "col-progress" },
  { key: "completed", label: "✅ Completed", className: "col-done" },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [loading, setLoading] = useState(true);
  const [dragOverColumn, setDragOverColumn] = useState<Task["status"] | null>(null);
  const draggedTask = useRef<Task | null>(null);

  const loadData = useCallback(async () => {
    const [tasksData, catsData, prisData] = await Promise.all([
      api.getTasks(),
      api.getCategories(),
      api.getPriorities(),
    ]);
    setTasks(tasksData);
    setCategories(catsData);
    setPriorities(prisData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal({ type: "none" });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleCreate = async (data: TaskFormData) => {
    const newTask = await api.createTask(data);
    setTasks((prev) => [...prev, newTask]);
    setModal({ type: "none" });
  };

  const handleUpdate = async (data: TaskFormData) => {
    if (modal.type !== "edit") return;
    const updated = await api.updateTask(modal.task.id, data);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setModal({ type: "none" });
  };

  const handleDelete = async () => {
    if (modal.type !== "confirm-delete") return;
    await api.deleteTask(modal.task.id);
    setTasks((prev) => prev.filter((t) => t.id !== modal.task.id));
    setModal({ type: "none" });
  };

  const handleStatusChange = async (task: Task, status: Task["status"]) => {
    const updated = await api.updateTask(task.id, { status });
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    // If viewing detail, update the modal task too
    if (modal.type === "detail" && modal.task.id === task.id) {
      setModal({ type: "detail", task: updated });
    }
  };

  // ─── Drag & Drop ───
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    draggedTask.current = task;
    e.dataTransfer.effectAllowed = "move";
    // Make the ghost slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add("dragging");
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    draggedTask.current = null;
    setDragOverColumn(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove("dragging");
    }
  };

  const handleColumnDragOver = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleColumnDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  };

  const handleColumnDrop = async (e: React.DragEvent, targetStatus: Task["status"]) => {
    e.preventDefault();
    setDragOverColumn(null);
    const task = draggedTask.current;
    if (!task || task.status === targetStatus) return;
    await handleStatusChange(task, targetStatus);
    draggedTask.current = null;
  };

  const tasksByStatus = (status: Task["status"]) =>
    tasks.filter((t) => t.status === status);

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pendingCount = tasks.length - completedCount;

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <h1>✅ Task Manager</h1>
        <div className="header-stats">
          <span>📊 Total: {tasks.length}</span>
          <span>⏳ Pending: {pendingCount}</span>
          <span>✅ Completed: {completedCount}</span>
        </div>
        <button className="btn-new-task" onClick={() => setModal({ type: "create" })}>
          + New Task
        </button>
      </header>

      {/* Kanban Board */}
      <main className="kanban-board">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus(col.key);
          return (
            <section key={col.key} className={`kanban-column ${col.className}${dragOverColumn === col.key ? " drag-over" : ""}`}
              onDragOver={(e) => handleColumnDragOver(e, col.key)}
              onDragLeave={handleColumnDragLeave}
              onDrop={(e) => handleColumnDrop(e, col.key)}
            >
              <div className="column-header">
                <span>{col.label}</span>
                <span className="count">{colTasks.length}</span>
              </div>
              <div className="column-body">
                {colTasks.length === 0 ? (
                  <div className="empty-column">
                    {dragOverColumn === col.key ? "Drop here" : "No tasks here"}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onView={(t) => setModal({ type: "detail", task: t })}
                      onEdit={(t) => setModal({ type: "edit", task: t })}
                      onDelete={(t) => setModal({ type: "confirm-delete", task: t })}
                      onStatusChange={handleStatusChange}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </main>

      {/* Modals */}
      {modal.type === "create" && (
        <TaskFormModal
          categories={categories}
          priorities={priorities}
          onSave={handleCreate}
          onClose={() => setModal({ type: "none" })}
        />
      )}

      {modal.type === "edit" && (
        <TaskFormModal
          task={modal.task}
          categories={categories}
          priorities={priorities}
          onSave={handleUpdate}
          onClose={() => setModal({ type: "none" })}
        />
      )}

      {modal.type === "detail" && (
        <TaskDetailModal
          task={modal.task}
          onClose={() => setModal({ type: "none" })}
          onStatusChange={handleStatusChange}
          onDelete={(t) => setModal({ type: "confirm-delete", task: t })}
          onEdit={(t) => setModal({ type: "edit", task: t })}
        />
      )}

      {modal.type === "confirm-delete" && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${modal.task.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setModal({ type: "none" })}
        />
      )}
    </>
  );
}
