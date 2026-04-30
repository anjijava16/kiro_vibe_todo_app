import { Router } from "express";
import db from "./db.js";

const router = Router();

// ─── Helper to build task response with joined fields ───
const TASK_SELECT = `
  SELECT
    t.id, t.title, t.description, t.status, t.due_date,
    t.sort_order,
    t.created_at, t.updated_at,
    t.priority_id, p.name AS priority_name, p.level AS priority_level, p.indicator AS priority_indicator,
    t.category_id, c.name AS category_name, c.emoji AS category_emoji
  FROM tasks t
  JOIN priorities p ON t.priority_id = p.id
  JOIN categories c ON t.category_id = c.id
`;

function formatTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    sort_order: row.sort_order,
    due_date: row.due_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    priority: {
      id: row.priority_id,
      name: row.priority_name,
      level: row.priority_level,
      indicator: row.priority_indicator,
    },
    category: {
      id: row.category_id,
      name: row.category_name,
      emoji: row.category_emoji,
    },
  };
}

// ─── GET /api/tasks ───
router.get("/tasks", (_req, res) => {
  const rows = db.prepare(`${TASK_SELECT} ORDER BY t.sort_order ASC, t.id ASC`).all();
  res.json(rows.map(formatTask));
});

// ─── PATCH /api/tasks/reorder ───
router.patch("/tasks/reorder", (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items array is required and must not be empty" });
  }

  // Validate all task IDs exist before applying changes
  for (const item of items) {
    const existing = db.prepare("SELECT id FROM tasks WHERE id = ?").get(item.id);
    if (!existing) {
      return res.status(404).json({ error: `Task with id ${item.id} not found` });
    }
  }

  // Update all sort_order values in a single transaction
  const updateStmt = db.prepare("UPDATE tasks SET sort_order = ?, updated_at = datetime('now') WHERE id = ?");
  const applyReorder = db.transaction((items) => {
    for (const item of items) {
      updateStmt.run(item.sort_order, item.id);
    }
  });

  applyReorder(items);
  res.json({ message: "Reorder successful" });
});

// ─── GET /api/tasks/:id ───
router.get("/tasks/:id", (req, res) => {
  const row = db.prepare(`${TASK_SELECT} WHERE t.id = ?`).get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: "Task not found" });
  res.json(formatTask(row));
});

// ─── POST /api/tasks ───
router.post("/tasks", (req, res) => {
  const { title, description, priority_id, category_id, due_date, status } = req.body;
  if (!title || !priority_id || !category_id) {
    return res.status(400).json({ error: "title, priority_id, and category_id are required" });
  }
  const targetStatus = status || "todo";
  const maxRow = db.prepare(
    "SELECT MAX(sort_order) AS max_sort FROM tasks WHERE status = ?"
  ).get(targetStatus);
  const sort_order = (maxRow && maxRow.max_sort != null) ? maxRow.max_sort + 1000 : 1000;

  const result = db.prepare(`
    INSERT INTO tasks (title, description, priority_id, category_id, due_date, status, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    description || "",
    priority_id,
    category_id,
    due_date || null,
    targetStatus,
    sort_order
  );
  const newTask = db.prepare(`${TASK_SELECT} WHERE t.id = ?`).get(result.lastInsertRowid);
  res.status(201).json(formatTask(newTask));
});

// ─── PUT /api/tasks/:id ───
router.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT id, status FROM tasks WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Task not found" });

  const { title, description, priority_id, category_id, due_date, status } = req.body;

  // When status changes, compute a new sort_order at the bottom of the target column
  let sort_order = null;
  if (status && status !== existing.status) {
    const maxRow = db.prepare(
      "SELECT MAX(sort_order) AS max_sort FROM tasks WHERE status = ?"
    ).get(status);
    sort_order = (maxRow && maxRow.max_sort != null) ? maxRow.max_sort + 1000 : 1000;
  }

  db.prepare(`
    UPDATE tasks
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        priority_id = COALESCE(?, priority_id),
        category_id = COALESCE(?, category_id),
        due_date = COALESCE(?, due_date),
        status = COALESCE(?, status),
        sort_order = COALESCE(?, sort_order),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title ?? null,
    description ?? null,
    priority_id ?? null,
    category_id ?? null,
    due_date ?? null,
    status ?? null,
    sort_order,
    id
  );
  const updated = db.prepare(`${TASK_SELECT} WHERE t.id = ?`).get(id);
  res.json(formatTask(updated));
});

// ─── DELETE /api/tasks/:id ───
router.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT id FROM tasks WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Task not found" });
  db.prepare("DELETE FROM comments WHERE task_id = ?").run(id);
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  res.json({ message: "Task deleted" });
});

// ─── GET /api/tasks/:id/comments ───
router.get("/tasks/:id/comments", (req, res) => {
  const taskId = Number(req.params.id);
  const comments = db
    .prepare("SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC")
    .all(taskId);
  res.json(comments);
});

// ─── POST /api/tasks/:id/comments ───
router.post("/tasks/:id/comments", (req, res) => {
  const taskId = Number(req.params.id);
  const existing = db.prepare("SELECT id FROM tasks WHERE id = ?").get(taskId);
  if (!existing) return res.status(404).json({ error: "Task not found" });

  const { text, author } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });

  const result = db.prepare(
    "INSERT INTO comments (task_id, text, author) VALUES (?, ?, ?)"
  ).run(taskId, text, author || "User");

  const comment = db.prepare("SELECT * FROM comments WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(comment);
});

// ─── DELETE /api/comments/:id ───
router.delete("/comments/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT id FROM comments WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Comment not found" });
  db.prepare("DELETE FROM comments WHERE id = ?").run(id);
  res.json({ message: "Comment deleted" });
});

// ─── GET /api/categories ───
router.get("/categories", (_req, res) => {
  const rows = db.prepare("SELECT * FROM categories ORDER BY name").all();
  res.json(rows);
});

// ─── GET /api/priorities ───
router.get("/priorities", (_req, res) => {
  const rows = db.prepare("SELECT * FROM priorities ORDER BY level DESC").all();
  res.json(rows);
});

export default router;
