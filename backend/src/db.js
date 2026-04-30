import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const DB_PATH = join(DATA_DIR, "todo.db");

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode and foreign keys
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      emoji TEXT NOT NULL DEFAULT '📋'
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS priorities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      level INTEGER NOT NULL,
      indicator TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'completed')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      priority_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      due_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (priority_id) REFERENCES priorities(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Migration: add sort_order column to existing databases that lack it
  const columns = db.pragma("table_info(tasks)");
  const hasSortOrder = columns.some((col) => col.name === "sort_order");
  if (!hasSortOrder) {
    db.exec(`ALTER TABLE tasks ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`);

    // Backfill existing tasks with sequential sort_order values grouped by status
    const statuses = db
      .prepare(`SELECT DISTINCT status FROM tasks`)
      .all()
      .map((row) => row.status);

    const updateStmt = db.prepare(
      `UPDATE tasks SET sort_order = ? WHERE id = ?`
    );

    const backfill = db.transaction(() => {
      for (const status of statuses) {
        const tasks = db
          .prepare(`SELECT id FROM tasks WHERE status = ? ORDER BY id ASC`)
          .all(status);
        let sortOrder = 1000;
        for (const task of tasks) {
          updateStmt.run(sortOrder, task.id);
          sortOrder += 1000;
        }
      }
    });

    backfill();
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'User',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);
}

export default db;
