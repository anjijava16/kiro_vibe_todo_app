import db, { initializeDatabase } from "./db.js";

initializeDatabase();

// Seed categories
const categories = [
  { name: "Work", emoji: "💼" },
  { name: "Personal", emoji: "🏠" },
  { name: "Health", emoji: "🏃" },
  { name: "Learning", emoji: "📚" },
  { name: "Finance", emoji: "💰" },
  { name: "Shopping", emoji: "🛒" },
];

const insertCategory = db.prepare(
  "INSERT OR IGNORE INTO categories (name, emoji) VALUES (?, ?)"
);
for (const cat of categories) {
  insertCategory.run(cat.name, cat.emoji);
}

// Seed priorities
const priorities = [
  { name: "High", level: 3, indicator: "🔴" },
  { name: "Medium", level: 2, indicator: "🟡" },
  { name: "Low", level: 1, indicator: "🟢" },
];

const insertPriority = db.prepare(
  "INSERT OR IGNORE INTO priorities (name, level, indicator) VALUES (?, ?, ?)"
);
for (const p of priorities) {
  insertPriority.run(p.name, p.level, p.indicator);
}

// Get IDs for reference
const getCategoryId = db.prepare("SELECT id FROM categories WHERE name = ?");
const getPriorityId = db.prepare("SELECT id FROM priorities WHERE name = ?");

const catWork = getCategoryId.get("Work").id;
const catPersonal = getCategoryId.get("Personal").id;
const catHealth = getCategoryId.get("Health").id;
const catLearning = getCategoryId.get("Learning").id;
const catFinance = getCategoryId.get("Finance").id;
const catShopping = getCategoryId.get("Shopping").id;

const priHigh = getPriorityId.get("High").id;
const priMedium = getPriorityId.get("Medium").id;
const priLow = getPriorityId.get("Low").id;

// Check if tasks already exist
const taskCount = db.prepare("SELECT COUNT(*) as count FROM tasks").get().count;
if (taskCount > 0) {
  console.log("Database already seeded. Skipping.");
  process.exit(0);
}

// Seed 10 sample tasks
const tasks = [
  {
    title: "Prepare quarterly report",
    description:
      "Compile Q1 sales data and create presentation slides for the board meeting. Include revenue trends, customer acquisition metrics, and projections for Q2.",
    status: "in-progress",
    priority_id: priHigh,
    category_id: catWork,
    due_date: "2026-05-05",
  },
  {
    title: "Schedule dentist appointment",
    description:
      "Call Dr. Smith's office to schedule a routine cleaning and checkup. Check if insurance covers the visit.",
    status: "todo",
    priority_id: priMedium,
    category_id: catHealth,
    due_date: "2026-05-10",
  },
  {
    title: "Complete TypeScript course",
    description:
      "Finish the remaining 5 modules of the advanced TypeScript course on Udemy. Focus on generics and decorators.",
    status: "in-progress",
    priority_id: priMedium,
    category_id: catLearning,
    due_date: "2026-05-15",
  },
  {
    title: "Buy groceries for the week",
    description:
      "Get vegetables, fruits, chicken, rice, and snacks. Check pantry for items running low before going.",
    status: "completed",
    priority_id: priLow,
    category_id: catShopping,
    due_date: "2026-04-28",
  },
  {
    title: "Review investment portfolio",
    description:
      "Check current asset allocation and rebalance if needed. Review performance of index funds and consider increasing retirement contributions.",
    status: "todo",
    priority_id: priHigh,
    category_id: catFinance,
    due_date: "2026-05-01",
  },
  {
    title: "Fix login page bug",
    description:
      "Users report intermittent 500 errors on the login page. Check server logs, review authentication middleware, and deploy a fix.",
    status: "todo",
    priority_id: priHigh,
    category_id: catWork,
    due_date: "2026-04-30",
  },
  {
    title: "Morning jog routine",
    description:
      "Start a consistent 30-minute morning jog routine. Map out a 3km route around the neighborhood park.",
    status: "in-progress",
    priority_id: priLow,
    category_id: catHealth,
    due_date: "2026-05-20",
  },
  {
    title: "Plan weekend trip",
    description:
      "Research destinations within 3 hours drive. Book accommodation and plan activities for Saturday and Sunday.",
    status: "todo",
    priority_id: priLow,
    category_id: catPersonal,
    due_date: "2026-05-08",
  },
  {
    title: "Update resume",
    description:
      "Add recent project experience, update skills section with new technologies learned, and get feedback from a colleague.",
    status: "completed",
    priority_id: priMedium,
    category_id: catPersonal,
    due_date: "2026-04-25",
  },
  {
    title: "Set up CI/CD pipeline",
    description:
      "Configure GitHub Actions for the new microservice. Include linting, testing, Docker build, and deployment to staging environment.",
    status: "todo",
    priority_id: priHigh,
    category_id: catWork,
    due_date: "2026-05-03",
  },
];

const insertTask = db.prepare(`
  INSERT INTO tasks (title, description, status, priority_id, category_id, due_date)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const task of tasks) {
  insertTask.run(
    task.title,
    task.description,
    task.status,
    task.priority_id,
    task.category_id,
    task.due_date
  );
}

// Seed sample comments
const sampleComments = [
  { task_id: 1, text: "Started gathering data from the sales team.", author: "Alice" },
  { task_id: 1, text: "Need to follow up with marketing for campaign metrics.", author: "Bob" },
  { task_id: 3, text: "Module on generics was really helpful!", author: "User" },
  { task_id: 5, text: "Scheduled a call with the financial advisor for next week.", author: "User" },
  { task_id: 6, text: "Reproduced the bug locally. Seems related to session handling.", author: "Dev Team" },
  { task_id: 6, text: "Possible fix: update the auth middleware timeout settings.", author: "Alice" },
  { task_id: 10, text: "Docker build step is ready. Working on the deploy stage now.", author: "User" },
];

const insertComment = db.prepare(
  "INSERT INTO comments (task_id, text, author) VALUES (?, ?, ?)"
);
for (const comment of sampleComments) {
  insertComment.run(comment.task_id, comment.text, comment.author);
}

console.log("✅ Database seeded successfully with 10 tasks and sample comments.");
