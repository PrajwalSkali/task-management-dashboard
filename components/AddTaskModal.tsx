"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  useTasks,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/context/TaskContext";

type AddTaskModalProps = {
  onClose: () => void;
  taskToEdit?: Task | null;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  role: "Owner" | "Admin" | "Member";
};

// ==========================================
// NORMALIZE DATE
// ==========================================

const normalizeDateForInput = (
  value?: string | null
): string => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  // Already correct: YYYY-MM-DD
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
  ) {
    return trimmed;
  }

  // ISO date/time:
  // 2026-09-10T00:00:00.000Z
  if (
    /^\d{4}-\d{2}-\d{2}T/.test(trimmed)
  ) {
    return trimmed.slice(0, 10);
  }

  // Old format: DD-MM-YYYY
  const dashMatch = trimmed.match(
    /^(\d{2})-(\d{2})-(\d{4})$/
  );

  if (dashMatch) {
    const [, day, month, year] =
      dashMatch;

    return `${year}-${month}-${day}`;
  }

  // Old format: DD/MM/YYYY
  const slashMatch = trimmed.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  );

  if (slashMatch) {
    const [, day, month, year] =
      slashMatch;

    return `${year}-${month}-${day}`;
  }

  return "";
};

export default function AddTaskModal({
  onClose,
  taskToEdit = null,
}: AddTaskModalProps) {
  const {
    addTask,
    updateTask,
    categories,
  } = useTasks();

  const [title, setTitle] = useState(
    taskToEdit?.title ?? ""
  );

  const [description, setDescription] =
    useState(
      taskToEdit?.description ?? ""
    );

  const [dueDate, setDueDate] =
    useState(
      normalizeDateForInput(
        taskToEdit?.dueDate
      )
    );

  const [category, setCategory] =
    useState(
      taskToEdit?.category ?? ""
    );

  const [categoryError, setCategoryError] =
    useState("");

  const [status, setStatus] =
    useState<TaskStatus>(
      taskToEdit?.status ?? "Pending"
    );

  const [priority, setPriority] =
    useState<TaskPriority>(
      taskToEdit?.priority ?? "Medium"
    );

  // ==========================================
  // PROJECT
  // ==========================================

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [projectId, setProjectId] =
    useState<string>(
      taskToEdit?.projectId ?? ""
    );

  const [isLoadingProjects, setIsLoadingProjects] =
    useState(false);

  // ==========================================
  // TEAM MEMBER ASSIGNMENT
  // ==========================================

  const [teamMembers, setTeamMembers] =
    useState<TeamMember[]>([]);

  const [assignedTo, setAssignedTo] =
    useState<string>(
      taskToEdit?.assignedTo ?? ""
    );

  const [isLoadingMembers, setIsLoadingMembers] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const isEditing =
    taskToEdit !== null;

  // ==========================================
  // LOAD PROJECTS
  // ==========================================

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoadingProjects(true);

        const response =
          await fetch("/api/projects");

        if (!response.ok) {
          throw new Error(
            "Failed to fetch projects"
          );
        }

        const data =
          await response.json();

        setProjects(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load projects:",
          error
        );
      } finally {
        setIsLoadingProjects(false);
      }
    };

    loadProjects();
  }, []);

  // ==========================================
  // LOAD TEAM MEMBERS
  // ==========================================

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setIsLoadingMembers(true);

        const response =
          await fetch("/api/users");

        if (!response.ok) {
          throw new Error(
            "Failed to fetch team members"
          );
        }

        const data =
          await response.json();

        setTeamMembers(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load team members:",
          error
        );
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadTeamMembers();
  }, []);

  // ==========================================
  // GET TODAY'S DATE
  // ==========================================

  const getTodayDate = () => {
    const today = new Date();

    const year =
      today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const todayDate =
    getTodayDate();

  // ==========================================
  // DEADLINE INFORMATION
  // ==========================================

  const getDeadlineMessage = () => {
    if (!dueDate) {
      return null;
    }

    const selectedDate =
      new Date(
        `${dueDate}T00:00:00`
      );

    const today =
      new Date(
        `${todayDate}T00:00:00`
      );

    const differenceInMs =
      selectedDate.getTime() -
      today.getTime();

    const differenceInDays =
      Math.round(
        differenceInMs /
          (1000 * 60 * 60 * 24)
      );

    if (differenceInDays < 0) {
      return {
        text:
          "This task is overdue.",
        className:
          "text-red-600",
      };
    }

    if (differenceInDays === 0) {
      return {
        text:
          "Due today.",
        className:
          "text-yellow-600",
      };
    }

    if (differenceInDays === 1) {
      return {
        text:
          "Due tomorrow.",
        className:
          "text-orange-600",
      };
    }

    return {
      text: `Due in ${differenceInDays} days.`,
      className:
        "text-green-600",
    };
  };

  const deadlineMessage =
    getDeadlineMessage();

  // ==========================================
  // FORM SUBMISSION
  // ==========================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedTitle =
      title.trim();

    const trimmedDescription =
      description.trim();

    const trimmedCategory =
      category.trim();

    // ==========================================
    // TITLE VALIDATION
    // ==========================================

    if (!trimmedTitle) {
      alert(
        "Please enter a task title."
      );
      return;
    }

    // ==========================================
    // NORMALIZE DUE DATE
    // ==========================================

    const normalizedDueDate =
      normalizeDateForInput(
        dueDate
      );

    // ==========================================
    // DUE DATE VALIDATION
    // ==========================================

    if (!normalizedDueDate) {
      alert(
        "Please select a valid due date."
      );
      return;
    }

    if (
      !isEditing &&
      normalizedDueDate < todayDate
    ) {
      alert(
        "Please select today or a future date."
      );
      return;
    }

    // ==========================================
    // CATEGORY VALIDATION
    // ==========================================

    if (!trimmedCategory) {
      setCategoryError(
        "Please select a category."
      );
      return;
    }

    setCategoryError("");

    // ==========================================
    // TASK DATA
    // ==========================================

    const taskData = {
      title: trimmedTitle,

      description:
        trimmedDescription,

      // Always send backend-compatible
      // YYYY-MM-DD format.
      dueDate:
        normalizedDueDate,

      category:
        trimmedCategory,

      status,

      priority,

      // Project
      projectId:
        projectId || null,

      // Assignment
      assignedTo:
        assignedTo || null,
    };

    try {
      setIsSubmitting(true);

      if (
        isEditing &&
        taskToEdit
      ) {
        await updateTask(
          taskToEdit.id,
          taskData
        );
      } else {
        await addTask(
          taskData
        );
      }

      onClose();
    } catch (error) {
      console.error(
        "Failed to save task:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save task."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // ESCAPE KEY
  // ==========================================

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape" &&
        !isSubmitting
      ) {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    isSubmitting,
    onClose,
  ]);

  // ==========================================
  // PREVENT BACKGROUND SCROLL
  // ==========================================

  useEffect(() => {
    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5">

      <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-2.5rem)]">

        {/* ======================================
            HEADER
        ====================================== */}

        <div className="relative shrink-0 overflow-hidden border-b border-slate-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-5 sm:px-6">

          <div className="pointer-events-none absolute -right-10 -top-14 h-32 w-32 rounded-full bg-white/10 blur-xl" />

          <div className="relative flex items-center justify-between gap-4">

            <div className="flex min-w-0 items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl text-white ring-1 ring-white/20">
                {isEditing ? "✎" : "+"}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-white sm:text-xl">
                  {isEditing
                    ? "Edit Task"
                    : "Add New Task"}
                </h2>

                <p className="mt-0.5 text-xs text-blue-100 sm:text-sm">
                  {isEditing
                    ? "Update the details of your task."
                    : "Create a task and keep your work organized."}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xl leading-none text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close modal"
            >
              ×
            </button>

          </div>
        </div>

        {/* ======================================
            FORM
        ====================================== */}

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >

          {/* ====================================
              SCROLLABLE FORM CONTENT
          ==================================== */}

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-6 sm:py-6">

            <div className="space-y-5">

              {/* ==================================
                  BASIC INFORMATION
              ================================== */}

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Basic Information
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Add the main details for this task.
                  </p>
                </div>

                <div className="space-y-4">

                  {/* Task Title */}

                  <div>
                    <label
                      htmlFor="task-title"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Task Title
                    </label>

                    <input
                      id="task-title"
                      type="text"
                      placeholder="Enter task title"
                      value={title}
                      onChange={(e) =>
                        setTitle(
                          e.target.value
                        )
                      }
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </div>

                  {/* Description */}

                  <div>
                    <label
                      htmlFor="task-description"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Description
                    </label>

                    <textarea
                      id="task-description"
                      placeholder="Describe what needs to be done..."
                      value={description}
                      onChange={(e) =>
                        setDescription(
                          e.target.value
                        )
                      }
                      rows={3}
                      disabled={isSubmitting}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </div>

                </div>
              </div>

              {/* ==================================
                  DEADLINE & CATEGORY
              ================================== */}

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Planning
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Set the deadline and category for this task.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {/* Due Date */}

                  <div>
                    <label
                      htmlFor="task-due-date"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Due Date
                    </label>

                    <input
                      id="task-due-date"
                      type="date"
                      value={dueDate}
                      min={
                        !isEditing
                          ? todayDate
                          : undefined
                      }
                      onChange={(e) =>
                        setDueDate(
                          e.target.value
                        )
                      }
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                    />

                    {deadlineMessage && (
                      <p
                        className={`mt-2 text-xs font-semibold ${deadlineMessage.className}`}
                      >
                        {deadlineMessage.text}
                      </p>
                    )}

                    {isEditing &&
                      dueDate < todayDate &&
                      status !==
                        "Completed" && (
                      <p className="mt-2 text-xs font-medium leading-5 text-red-600">
                        ⚠ This task currently has an overdue deadline. You can update it to a new date.
                      </p>
                    )}
                  </div>

                  {/* Category */}

                  <div>
                    <label
                      htmlFor="task-category"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Category
                    </label>

                    <select
                      id="task-category"
                      value={category}
                      onChange={(e) => {
                        setCategory(
                          e.target.value
                        );

                        if (
                          e.target.value.trim()
                        ) {
                          setCategoryError("");
                        }
                      }}
                      disabled={isSubmitting}
                      aria-invalid={
                        Boolean(categoryError)
                      }
                      aria-describedby={
                        categoryError
                          ? "task-category-error"
                          : undefined
                      }
                      className={`w-full rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-4 disabled:bg-slate-100 ${
                        categoryError
                          ? "border border-red-500 focus:border-red-500 focus:ring-red-100"
                          : "border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                      }`}
                    >
                      <option value="">
                        Select a category
                      </option>

                      {categories.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}
                    </select>

                    {categoryError && (
                      <p
                        id="task-category-error"
                        className="mt-2 text-xs font-medium text-red-600"
                      >
                        {categoryError}
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* ==================================
                  PROJECT & ASSIGNMENT
              ================================== */}

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Collaboration
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Connect this task to a project or team member.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {/* Project */}

                  <div>
                    <label
                      htmlFor="task-project"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Project
                    </label>

                    <select
                      id="task-project"
                      value={projectId}
                      onChange={(e) =>
                        setProjectId(
                          e.target.value
                        )
                      }
                      disabled={
                        isSubmitting ||
                        isLoadingProjects
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                    >
                      <option value="">
                        {isLoadingProjects
                          ? "Loading projects..."
                          : "No Project"}
                      </option>

                      {projects.map(
                        (project) => (
                          <option
                            key={project.id}
                            value={project.id}
                          >
                            {project.name}
                          </option>
                        )
                      )}
                    </select>

                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Select a project if this task belongs to a shared workspace.
                    </p>
                  </div>

                  {/* Assign Team Member */}

                  <div>
                    <label
                      htmlFor="task-assigned-to"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Assign To
                    </label>

                    <select
                      id="task-assigned-to"
                      value={assignedTo}
                      onChange={(e) =>
                        setAssignedTo(
                          e.target.value
                        )
                      }
                      disabled={
                        isSubmitting ||
                        isLoadingMembers
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                    >
                      <option value="">
                        {isLoadingMembers
                          ? "Loading team members..."
                          : "Unassigned"}
                      </option>

                      {teamMembers.map(
                        (member) => (
                          <option
                            key={member.id}
                            value={member.id}
                          >
                            {member.name} (
                            {member.email})
                          </option>
                        )
                      )}
                    </select>

                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Select a team member responsible for this task.
                    </p>
                  </div>

                </div>
              </div>

              {/* ==================================
                  STATUS & PRIORITY
              ================================== */}

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Task Progress
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Set the current state and importance of this task.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {/* Priority */}

                  <div>
                    <label
                      htmlFor="task-priority"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Priority
                    </label>

                    <select
                      id="task-priority"
                      value={priority}
                      onChange={(e) =>
                        setPriority(
                          e.target.value as TaskPriority
                        )
                      }
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                    >
                      <option value="Low">
                        Low
                      </option>

                      <option value="Medium">
                        Medium
                      </option>

                      <option value="High">
                        High
                      </option>
                    </select>
                  </div>

                  {/* Status */}

                  <div>
                    <label
                      htmlFor="task-status"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Status
                    </label>

                    <select
                      id="task-status"
                      value={status}
                      onChange={(e) =>
                        setStatus(
                          e.target.value as TaskStatus
                        )
                      }
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                    >
                      <option value="Pending">
                        Pending
                      </option>

                      <option value="In Progress">
                        In Progress
                      </option>

                      <option value="Completed">
                        Completed
                      </option>
                    </select>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* ====================================
              FIXED ACTION BUTTONS
          ==================================== */}

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:from-blue-400 disabled:to-indigo-400 sm:w-auto"
            >
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Adding..."
                : isEditing
                  ? "Save Changes"
                  : "Add Task"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}