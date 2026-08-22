"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type TaskStatus =
  | "Pending"
  | "In Progress"
  | "Completed";

export type TaskPriority =
  | "Low"
  | "Medium"
  | "High";

export type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  category: string;
  status: TaskStatus;
  priority: TaskPriority;
};

type TaskContextType = {
  tasks: Task[];
  categories: string[];

  addTask: (task: Omit<Task, "id">) => void;

  deleteTask: (id: number) => void;

  updateTask: (
    id: number,
    updatedTask: Partial<Task>
  ) => void;

  addCategory: (category: string) => void;

  deleteCategory: (category: string) => void;
};

const TaskContext = createContext<
  TaskContextType | undefined
>(undefined);

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Complete project documentation",
    description: "Complete the project documentation.",
    dueDate: "2026-08-25",
    category: "Project",
    status: "In Progress",
    priority: "High",
  },
  {
    id: 2,
    title: "Prepare presentation",
    description: "Prepare slides for the presentation.",
    dueDate: "2026-08-27",
    category: "College",
    status: "Completed",
    priority: "Medium",
  },
  {
    id: 3,
    title: "Review internship tasks",
    description: "Review and complete internship tasks.",
    dueDate: "2026-08-30",
    category: "Work",
    status: "Pending",
    priority: "High",
  },
];

const initialCategories = [
  "General",
  "College",
  "Work",
  "Personal",
  "Project",
];

export function TaskProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [tasks, setTasks] =
    useState<Task[]>(initialTasks);

  const [categories, setCategories] =
    useState<string[]>(initialCategories);

  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved data
  useEffect(() => {
    try {
      const savedTasks =
        localStorage.getItem("taskflow_tasks");

      const savedCategories =
        localStorage.getItem("taskflow_categories");

      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }

      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      }
    } catch (error) {
      console.error(
        "Failed to load TaskFlow data:",
        error
      );
    }

    setIsLoaded(true);
  }, []);

  // Save tasks
  useEffect(() => {
    if (!isLoaded) return;

    try {
      localStorage.setItem(
        "taskflow_tasks",
        JSON.stringify(tasks)
      );
    } catch (error) {
      console.error(
        "Failed to save tasks:",
        error
      );
    }
  }, [tasks, isLoaded]);

  // Save categories
  useEffect(() => {
    if (!isLoaded) return;

    try {
      localStorage.setItem(
        "taskflow_categories",
        JSON.stringify(categories)
      );
    } catch (error) {
      console.error(
        "Failed to save categories:",
        error
      );
    }
  }, [categories, isLoaded]);

  // Add Task
  const addTask = (task: Omit<Task, "id">) => {
    const newTask: Task = {
      ...task,
      id: Date.now(),
    };

    setTasks((currentTasks) => [
      ...currentTasks,
      newTask,
    ]);
  };

  // Delete Task
  const deleteTask = (id: number) => {
    setTasks((currentTasks) =>
      currentTasks.filter(
        (task) => task.id !== id
      )
    );
  };

  // Update Task
  const updateTask = (
    id: number,
    updatedTask: Partial<Task>
  ) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              ...updatedTask,
            }
          : task
      )
    );
  };

  // Add Category
  const addCategory = (category: string) => {
    const newCategory = category.trim();

    if (!newCategory) {
      return;
    }

    setCategories((currentCategories) => {
      const alreadyExists =
        currentCategories.some(
          (item) =>
            item.toLowerCase() ===
            newCategory.toLowerCase()
        );

      if (alreadyExists) {
        return currentCategories;
      }

      return [
        ...currentCategories,
        newCategory,
      ];
    });
  };

  // Delete Category
  const deleteCategory = (category: string) => {
    const hasTasks = tasks.some(
      (task) => task.category === category
    );

    if (hasTasks) {
      return;
    }

    setCategories((currentCategories) =>
      currentCategories.filter(
        (item) => item !== category
      )
    );
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        categories,
        addTask,
        deleteTask,
        updateTask,
        addCategory,
        deleteCategory,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);

  if (!context) {
    throw new Error(
      "useTasks must be used inside TaskProvider"
    );
  }

  return context;
}