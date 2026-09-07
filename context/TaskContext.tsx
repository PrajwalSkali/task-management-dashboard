"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// ==========================================
// TYPES
// ==========================================

export type TaskStatus =
  | "Pending"
  | "In Progress"
  | "Completed";

export type TaskPriority =
  | "Low"
  | "Medium"
  | "High";

export type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  category: string;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;

  // Project
  projectId?: string | null;

  // Team assignment
  assignedTo?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

// ==========================================
// CONTEXT TYPE
// ==========================================

type TaskContextType = {
  tasks: Task[];
  categories: string[];

  addTask: (
    task: Omit<Task, "id" | "order">
  ) => Promise<void>;

  deleteTask: (id: string) => Promise<void>;

  updateTask: (
    id: string,
    updatedTask: Partial<Task>
  ) => Promise<void>;

  addCategory: (category: string) => Promise<void>;

  deleteCategory: (category: string) => Promise<void>;
};

// ==========================================
// CREATE CONTEXT
// ==========================================

const TaskContext = createContext<
  TaskContextType | undefined
>(undefined);

// ==========================================
// INITIAL CATEGORIES
// ==========================================

const initialCategories = [
  "General",
  "College",
  "Work",
  "Personal",
  "Project",
];

// ==========================================
// TASK PROVIDER
// ==========================================

export function TaskProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] =
    useState<string[]>(initialCategories);

  // ==========================================
  // LOAD TASKS + CATEGORIES
  // ==========================================

  useEffect(() => {
    const loadData = async () => {
      try {
        // ------------------------------
        // LOAD TASKS
        // ------------------------------

        const tasksResponse =
          await fetch("/api/tasks");

        if (!tasksResponse.ok) {
          throw new Error(
            "Failed to fetch tasks"
          );
        }

        const tasksData =
          await tasksResponse.json();

        const formattedTasks: Task[] =
          tasksData.map(
            (task: any, index: number) => ({
              // API returns "id"
              id: task.id,

              title: task.title,

              description:
                task.description || "",

              dueDate: task.dueDate,

              category: task.category,

              status: task.status,

              priority: task.priority,

              order:
                typeof task.order === "number"
                  ? task.order
                  : index,

              // Project
              projectId:
                task.projectId ?? null,

              // Team assignment
              assignedTo:
                task.assignedTo ?? null,

              createdAt: task.createdAt,

              updatedAt: task.updatedAt,
            })
          );

        setTasks(formattedTasks);

        // ------------------------------
        // LOAD CATEGORIES
        // ------------------------------

        const categoriesResponse =
          await fetch(
            "/api/categories"
          );

        if (!categoriesResponse.ok) {
          throw new Error(
            "Failed to fetch categories"
          );
        }

        const categoriesData =
          await categoriesResponse.json();

        const formattedCategories: string[] =
          categoriesData.map(
            (category: any) =>
              category.name
          );

        setCategories(
          formattedCategories
        );
      } catch (error) {
        console.error(
          "Failed to load data:",
          error
        );
      }
    };

    loadData();
  }, []);

  // ==========================================
  // ADD TASK
  // ==========================================

  const addTask = async (
    task: Omit<Task, "id" | "order">
  ): Promise<void> => {
    try {
      const response = await fetch(
        "/api/tasks",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(task),
        }
      );

      let data: any = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to create task"
        );
      }

      const newTask: Task = {
        // API returns "id"
        id: data.id,

        title: data.title,

        description:
          data.description || "",

        dueDate: data.dueDate,

        category: data.category,

        status: data.status,

        priority: data.priority,

        order:
          typeof data.order === "number"
            ? data.order
            : tasks.length,

        // Project
        projectId:
          data.projectId ?? null,

        // Team assignment
        assignedTo:
          data.assignedTo ?? null,

        createdAt: data.createdAt,

        updatedAt: data.updatedAt,
      };

      setTasks(
        (currentTasks) => [
          ...currentTasks,
          newTask,
        ]
      );

      console.log(
        "Task created successfully:",
        newTask
      );
    } catch (error) {
      console.error(
        "Failed to add task:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to add task."
      );
    }
  };

  // ==========================================
  // DELETE TASK
  // ==========================================

  const deleteTask = async (
    id: string
  ): Promise<void> => {
    try {
      const response = await fetch(
        `/api/tasks/${encodeURIComponent(
          id
        )}`,
        {
          method: "DELETE",
        }
      );

      let data: any = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to delete task"
        );
      }

      setTasks(
        (currentTasks) =>
          currentTasks.filter(
            (task) =>
              task.id !== id
          )
      );

      console.log(
        "Task deleted successfully:",
        id
      );
    } catch (error) {
      console.error(
        "Failed to delete task:",
        error
      );

      throw error instanceof Error
        ? error
        : new Error(
            "Failed to delete task."
          );
    }
  };

  // ==========================================
  // UPDATE TASK
  // ==========================================

  const updateTask = async (
    id: string,
    updatedTask: Partial<Task>
  ): Promise<void> => {
    try {
      const response = await fetch(
        `/api/tasks/${encodeURIComponent(
          id
        )}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            updatedTask
          ),
        }
      );

      let data: any = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to update task"
        );
      }

      const updated: Task = {
        // API returns "id"
        id: data.id,

        title: data.title,

        description:
          data.description || "",

        dueDate: data.dueDate,

        category: data.category,

        status: data.status,

        priority: data.priority,

        order:
          typeof data.order === "number"
            ? data.order
            : updatedTask.order ?? 0,

        // Project
        projectId:
          data.projectId ?? null,

        // Team assignment
        assignedTo:
          data.assignedTo ?? null,

        createdAt: data.createdAt,

        updatedAt: data.updatedAt,
      };

      setTasks(
        (currentTasks) =>
          currentTasks.map(
            (task) =>
              task.id === id
                ? updated
                : task
          )
      );

      console.log(
        "Task updated successfully:",
        updated
      );
    } catch (error) {
      console.error(
        "Failed to update task:",
        error
      );

      throw error instanceof Error
        ? error
        : new Error(
            "Failed to update task."
          );
    }
  };

  // ==========================================
  // ADD CATEGORY
  // ==========================================

  const addCategory = async (
    category: string
  ): Promise<void> => {
    const newCategory =
      category.trim();

    if (!newCategory) {
      throw new Error(
        "Please enter a category name."
      );
    }

    const alreadyExists =
      categories.some(
        (item) =>
          item.toLowerCase() ===
          newCategory.toLowerCase()
      );

    if (alreadyExists) {
      throw new Error(
        "This category already exists."
      );
    }

    try {
      const response = await fetch(
        "/api/categories",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: newCategory,
          }),
        }
      );

      let data: any = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(
            data?.error ||
              "Please enter a valid category name."
          );
        }

        if (response.status === 401) {
          throw new Error(
            data?.error ||
              "You are not authorized. Please log in again."
          );
        }

        if (response.status === 409) {
          throw new Error(
            data?.error ||
              "This category already exists."
          );
        }

        if (response.status >= 500) {
          throw new Error(
            data?.error ||
              "Server error. Please try again later."
          );
        }

        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to create category."
        );
      }

      if (!data?.name) {
        throw new Error(
          "Category was created, but the server returned invalid data."
        );
      }

      setCategories(
        (currentCategories) => [
          ...currentCategories,
          data.name,
        ]
      );

      console.log(
        "Category created successfully:",
        data.name
      );
    } catch (error) {
      console.error(
        "Failed to add category:",
        error
      );

      throw error instanceof Error
        ? error
        : new Error(
            "Failed to add category."
          );
    }
  };

  // ==========================================
  // DELETE CATEGORY
  // ==========================================

  const deleteCategory = async (
    category: string
  ): Promise<void> => {
    try {
      const hasTasks =
        tasks.some(
          (task) =>
            task.category ===
            category
        );

      if (hasTasks) {
        throw new Error(
          "Cannot delete a category that has tasks."
        );
      }

      const response = await fetch(
        `/api/categories/${encodeURIComponent(
          category
        )}`,
        {
          method: "DELETE",
        }
      );

      let data: any = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to delete category"
        );
      }

      setCategories(
        (currentCategories) =>
          currentCategories.filter(
            (item) =>
              item !== category
          )
      );

      console.log(
        "Category deleted successfully:",
        category
      );
    } catch (error) {
      console.error(
        "Failed to delete category:",
        error
      );

      throw error instanceof Error
        ? error
        : new Error(
            "Failed to delete category."
          );
    }
  };

  // ==========================================
  // PROVIDER
  // ==========================================

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

// ==========================================
// useTasks HOOK
// ==========================================

export function useTasks(): TaskContextType {
  const context =
    useContext(TaskContext);

  if (!context) {
    throw new Error(
      "useTasks must be used inside a TaskProvider"
    );
  }

  return context;
}