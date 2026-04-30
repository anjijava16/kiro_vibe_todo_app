import React from "react";
import type { Task } from "../types";

interface Props {
  task: Task;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: Task["status"]) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export default function TaskCard({ task, onView, onEdit, onDelete, onStatusChange, onDragStart, onDragEnd }: Props) {
  const isOverdue =
    task.due_date &&
    task.status !== "completed" &&
    new Date(task.due_date) < new Date(new Date().toISOString().split("T")[0]);

  const priorityClass = `badge-priority-${task.priority.name.toLowerCase()}`;

  const nextStatus: Record<string, Task["status"]> = {
    todo: "in-progress",
    "in-progress": "completed",
    completed: "todo",
  };

  const statusLabels: Record<string, string> = {
    todo: "▶ Start",
    "in-progress": "✓ Complete",
    completed: "↩ Reopen",
  };

  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onView(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onView(task); }}
      aria-label={`Task: ${task.title}`}
    >
      <div className="task-card-header">
        <span className="task-card-title">{task.title}</span>
        <div className="task-card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn-icon"
            onClick={() => onStatusChange(task, nextStatus[task.status])}
            title={statusLabels[task.status]}
            aria-label={statusLabels[task.status]}
          >
            {task.status === "completed" ? "↩" : task.status === "todo" ? "▶" : "✓"}
          </button>
          <button className="btn-icon" onClick={() => onEdit(task)} title="Edit" aria-label="Edit task">
            ✏️
          </button>
          <button className="btn-icon danger" onClick={() => onDelete(task)} title="Delete" aria-label="Delete task">
            🗑️
          </button>
        </div>
      </div>
      <div className="task-card-meta">
        <span className="badge">{task.category.emoji} {task.category.name}</span>
        <span className={`badge ${priorityClass}`}>
          {task.priority.indicator} {task.priority.name}
        </span>
      </div>
      {task.due_date && (
        <span className={`due-date ${isOverdue ? "overdue" : ""}`}>
          📅 {new Date(task.due_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {isOverdue && " (overdue)"}
        </span>
      )}
    </div>
  );
}
