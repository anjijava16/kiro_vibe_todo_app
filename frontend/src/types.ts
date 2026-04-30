export interface Priority {
  id: number;
  name: string;
  level: number;
  indicator: string;
}

export interface Category {
  id: number;
  name: string;
  emoji: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "completed";
  due_date: string | null;
  created_at: string;
  updated_at: string;
  priority: Priority;
  category: Category;
}

export interface Comment {
  id: number;
  task_id: number;
  text: string;
  author: string;
  created_at: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority_id: number;
  category_id: number;
  due_date: string;
  status?: string;
}
