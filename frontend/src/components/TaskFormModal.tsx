import React, { useState, useEffect } from "react";
import type { Task, Category, Priority, TaskFormData } from "../types";

interface Props {
  task?: Task | null;
  categories: Category[];
  priorities: Priority[];
  onSave: (data: TaskFormData) => void;
  onClose: () => void;
}

export default function TaskFormModal({ task, categories, priorities, onSave, onClose }: Props) {
  const [form, setForm] = useState<TaskFormData>({
    title: "",
    description: "",
    priority_id: priorities[1]?.id || 1,
    category_id: categories[0]?.id || 1,
    due_date: "",
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description,
        priority_id: task.priority.id,
        category_id: task.category.id,
        due_date: task.due_date || "",
      });
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  const update = (field: keyof TaskFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isEdit = !!task;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={isEdit ? "Edit Task" : "New Task"}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit Task" : "New Task"}</h2>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="task-title">Title *</label>
              <input
                id="task-title"
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="What needs to be done?"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="task-desc">Description</label>
              <textarea
                id="task-desc"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Add details..."
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  value={form.priority_id}
                  onChange={(e) => update("priority_id", Number(e.target.value))}
                >
                  {priorities.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.indicator} {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="task-category">Category</label>
                <select
                  id="task-category"
                  value={form.category_id}
                  onChange={(e) => update("category_id", Number(e.target.value))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="task-due">Due Date</label>
              <input
                id="task-due"
                type="date"
                value={form.due_date}
                onChange={(e) => update("due_date", e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
