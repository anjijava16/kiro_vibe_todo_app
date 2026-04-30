# ✅ Task Manager — Kanban To-Do App

A full-stack task management application with a Kanban-style dashboard, built with React, Express, and Node.js native SQLite.

## Architecture

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 19 + Vite                     |
| Backend  | Express 4 (Node.js)                 |
| Database | SQLite via `better-sqlite3`              |
| Runtime  | Node.js v18+                              |

## Prerequisites

- **Node.js v18+**
- npm

## Quick Start

```bash
# 1. Install dependencies
npm install --prefix backend
npm install --prefix frontend

# 2. Seed the database (10 sample tasks + comments)
cd backend && npm run seed && cd ..

# 3. Start the backend (port 3001)
cd backend && npm run dev

# 4. In another terminal, start the frontend (port 5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

## Features

- **Kanban board** with three columns: To Do, In Progress, Completed
- **10 pre-loaded sample tasks** across 6 categories
- **Emoji categories**: 💼 Work, 🏠 Personal, 🏃 Health, 📚 Learning, 💰 Finance, 🛒 Shopping
- **Priority indicators**: 🔴 High, 🟡 Medium, 🟢 Low
- **Task counters** in header (total, pending, completed) and per column
- **Create/Edit modal** with title, description, priority, category, due date
- **Task detail modal** with full description, status selector, comments section
- **Notes/comments** per task with add and delete
- **Delete confirmation dialog** before removing any task
- **Overdue date highlighting** for past-due tasks
- **Keyboard accessible** — Escape closes modals, cards are focusable

## API Endpoints

| Method | Endpoint                  | Description            |
|--------|---------------------------|------------------------|
| GET    | `/api/tasks`              | List all tasks         |
| GET    | `/api/tasks/:id`          | Get a single task      |
| POST   | `/api/tasks`              | Create a task          |
| PUT    | `/api/tasks/:id`          | Update a task          |
| DELETE | `/api/tasks/:id`          | Delete a task          |
| GET    | `/api/tasks/:id/comments` | List task comments     |
| POST   | `/api/tasks/:id/comments` | Add a comment          |
| DELETE | `/api/comments/:id`       | Delete a comment       |
| GET    | `/api/categories`         | List categories        |
| GET    | `/api/priorities`         | List priorities        |

## Database

SQLite database is stored at `backend/data/todo.db`. Tables:
- `tasks` — id, title, description, status, priority_id, category_id, due_date, timestamps
- `categories` — id, name, emoji
- `priorities` — id, name, level, indicator
- `comments` — id, task_id, text, author, created_at
