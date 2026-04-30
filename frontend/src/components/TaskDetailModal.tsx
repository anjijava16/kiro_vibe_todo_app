import React, { useState, useEffect } from "react";
import type { Task, Comment } from "../types";
import * as api from "../api";

interface Props {
  task: Task;
  onClose: () => void;
  onStatusChange: (task: Task, status: Task["status"]) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
}

export default function TaskDetailModal({ task, onClose, onStatusChange, onDelete, onEdit }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getComments(task.id).then((data) => {
      setComments(data);
      setLoading(false);
    });
  }, [task.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment = await api.addComment(task.id, newComment.trim());
    setComments((prev) => [...prev, comment]);
    setNewComment("");
  };

  const handleDeleteComment = async (id: number) => {
    await api.deleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const isOverdue =
    task.due_date &&
    task.status !== "completed" &&
    new Date(task.due_date) < new Date(new Date().toISOString().split("T")[0]);

  const statusLabels: Record<string, string> = {
    todo: "📋 To Do",
    "in-progress": "🔄 In Progress",
    completed: "✅ Completed",
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Task Details">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task.title}</h2>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          {/* Status & Meta */}
          <div className="detail-section">
            <div className="detail-meta">
              <span className="detail-meta-item">
                {task.category.emoji} {task.category.name}
              </span>
              <span className="detail-meta-item">
                {task.priority.indicator} {task.priority.name} Priority
              </span>
              {task.due_date && (
                <span className={`detail-meta-item ${isOverdue ? "overdue" : ""}`}>
                  📅 {new Date(task.due_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {isOverdue && " (overdue)"}
                </span>
              )}
            </div>
          </div>

          {/* Status Selector */}
          <div className="detail-section">
            <h3>Status</h3>
            <div className="status-selector">
              {(["todo", "in-progress", "completed"] as const).map((s) => (
                <button
                  key={s}
                  className={`status-btn ${s} ${task.status === s ? "active" : ""}`}
                  onClick={() => onStatusChange(task, s)}
                >
                  {statusLabels[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="detail-section">
            <h3>Description</h3>
            <div className="detail-description">
              {task.description || "No description provided."}
            </div>
          </div>

          {/* Actions */}
          <div className="detail-section">
            <div className="detail-actions">
              {task.status !== "completed" && (
                <button
                  className="btn btn-success"
                  onClick={() => onStatusChange(task, "completed")}
                >
                  ✓ Mark Completed
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => onEdit(task)}>
                ✏️ Edit
              </button>
              <button className="btn btn-danger" onClick={() => onDelete(task)}>
                🗑️ Delete
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="detail-section">
            <h3>Notes & Comments</h3>
            {loading ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Loading comments...</p>
            ) : (
              <>
                {comments.length > 0 ? (
                  <div className="comments-list">
                    {comments.map((c) => (
                      <div key={c.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-author">{c.author}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span className="comment-date">
                              {new Date(c.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <button
                              className="btn-icon danger"
                              onClick={() => handleDeleteComment(c.id)}
                              title="Delete comment"
                              aria-label="Delete comment"
                              style={{ fontSize: "0.7rem", padding: "0.15rem 0.3rem" }}
                            >
                              ×
                            </button>
                          </span>
                        </div>
                        <div className="comment-text">{c.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                    No comments yet.
                  </p>
                )}
                <form className="comment-form" onSubmit={handleAddComment}>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    aria-label="New comment"
                  />
                  <button type="submit">Post</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
