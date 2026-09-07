"use client";

import { useEffect, useState } from "react";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import TaskCard from "@/components/TaskCard";
import AddTaskModal from "@/components/AddTaskModal";

import {
  useTasks,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/context/TaskContext";

type SortOption =
  | "newest"
  | "oldest"
  | "dueSoon"
  | "dueLate"
  | "priority";

type TeamMember = {
  id: string;
  name: string;
  email: string;
};

/* =========================================================
   SORTABLE TASK
========================================================= */

function SortableTask({
  task,
  assignedUserName,
  onEdit,
  onDelete,
}: {
  task: Task;
  assignedUserName?: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex min-w-0 items-stretch ${
        isDragging
          ? "relative z-10 rounded-xl bg-blue-50 shadow-xl ring-2 ring-blue-200"
          : "bg-white"
      }`}
    >
      {/* Drag Handle */}

      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${task.title}`}
        className={`flex w-10 shrink-0 cursor-grab items-center justify-center self-stretch border-r transition active:cursor-grabbing ${
          isDragging
            ? "border-blue-200 bg-blue-100 text-blue-500"
            : "border-slate-100 bg-slate-50 text-slate-300 hover:bg-blue-50 hover:text-blue-500"
        }`}
      >
        <span className="text-lg leading-none tracking-[-3px]">
          ⋮⋮
        </span>
      </button>

      {/* Task Card */}

      <div className="min-w-0 flex-1">
        <TaskCard
          id={task.id}
          title={task.title}
          dueDate={task.dueDate}
          status={task.status}
          priority={task.priority}
          assignedTo={task.assignedTo}
          assignedUserName={assignedUserName}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

/* =========================================================
   TASKS PAGE
========================================================= */

export default function TasksPage() {
  const {
    tasks,
    categories,
    deleteTask,
    updateTask,
  } = useTasks();

  const [showAddTask, setShowAddTask] =
    useState(false);

  const [selectedTask, setSelectedTask] =
    useState<string | null>(null);

  // Search
  const [searchTerm, setSearchTerm] =
    useState("");

  // Status filter
  const [statusFilter, setStatusFilter] =
    useState<"All" | TaskStatus>("All");

  // Category filter
  const [categoryFilter, setCategoryFilter] =
    useState("All");

  // Priority filter
  const [priorityFilter, setPriorityFilter] =
    useState<"All" | TaskPriority>("All");

  // Assignee filter
  const [assigneeFilter, setAssigneeFilter] =
    useState("All");

  // Overdue filter
  const [overdueFilter, setOverdueFilter] =
    useState(false);

  // Sort
  const [sortOption, setSortOption] =
    useState<SortOption>("newest");

  // Manual drag order
  const [taskOrder, setTaskOrder] =
    useState<string[]>([]);

  // ==========================================
  // TEAM MEMBERS
  // ==========================================

  const [teamMembers, setTeamMembers] =
    useState<TeamMember[]>([]);

  /* =========================================================
     LOAD TEAM MEMBERS
  ========================================================= */

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
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
      }
    };

    loadTeamMembers();
  }, []);

  /* =========================================================
     DRAG SENSOR
  ========================================================= */

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  /* =========================================================
     KEEP TASK ORDER IN SYNC
  ========================================================= */

  useEffect(() => {
    setTaskOrder((currentOrder) => {
      const currentTaskIds = tasks.map(
        (task) => task.id
      );

      const existingIds = currentOrder.filter(
        (id) => currentTaskIds.includes(id)
      );

      const newIds = currentTaskIds.filter(
        (id) =>
          !currentOrder.includes(id)
      );

      return [
        ...existingIds,
        ...newIds,
      ];
    });
  }, [tasks]);

  /* =========================================================
     CATEGORIES
  ========================================================= */

  // Categories come from TaskContext so categories with zero
  // tasks are also available in the filter dropdown.
  const availableCategories = Array.from(
    new Set(
      categories
        .map((category) => category.trim())
        .filter(Boolean)
    )
  );

  /* =========================================================
     FIND TEAM MEMBER NAME
  ========================================================= */

  const getAssignedUserName = (
    assignedTo?: string | null
  ) => {
    if (!assignedTo) {
      return null;
    }

    const member = teamMembers.find(
      (item) =>
        item.id === assignedTo
    );

    return member?.name ?? null;
  };

  /* =========================================================
     TODAY'S DATE
  ========================================================= */

  const today = new Date();

  const todayDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  /* =========================================================
     EDIT TASK
  ========================================================= */

  const handleEditTask = (
    id: string
  ) => {
    setSelectedTask(id);
    setShowAddTask(true);
  };

  /* =========================================================
     DELETE TASK
  ========================================================= */

  const handleDeleteTask = async (
    id: string
  ) => {
    try {
      await deleteTask(id);
    } catch (error) {
      console.error(
        "Failed to delete task:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete task."
      );
    }
  };

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const handleCloseModal = () => {
    setShowAddTask(false);
    setSelectedTask(null);
  };

  /* =========================================================
     FILTER TASKS
  ========================================================= */

  const filteredTasks =
    tasks.filter(
      (task) => {
        const matchesSearch =
          task.title
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            );

        const matchesStatus =
          statusFilter === "All" ||
          task.status ===
            statusFilter;

        const matchesCategory =
          categoryFilter === "All" ||
          task.category ===
            categoryFilter;

        const matchesPriority =
          priorityFilter === "All" ||
          task.priority ===
            priorityFilter;

        const matchesAssignee =
          assigneeFilter === "All"
            ? true
            : assigneeFilter ===
              "Unassigned"
              ? !task.assignedTo
              : task.assignedTo ===
                assigneeFilter;

        const matchesOverdue =
          !overdueFilter ||
          (task.dueDate < todayDate &&
            task.status !== "Completed");

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategory &&
          matchesPriority &&
          matchesAssignee &&
          matchesOverdue
        );
      }
    );

  /* =========================================================
     SORT TASKS
  ========================================================= */

  const sortedTasks = [
    ...filteredTasks,
  ].sort((a, b) => {
    switch (sortOption) {
      case "newest":
        return (
          new Date(
            b.createdAt ?? 0
          ).getTime() -
          new Date(
            a.createdAt ?? 0
          ).getTime()
        );

      case "oldest":
        return (
          new Date(
            a.createdAt ?? 0
          ).getTime() -
          new Date(
            b.createdAt ?? 0
          ).getTime()
        );

      case "dueSoon":
        return (
          new Date(
            a.dueDate
          ).getTime() -
          new Date(
            b.dueDate
          ).getTime()
        );

      case "dueLate":
        return (
          new Date(
            b.dueDate
          ).getTime() -
          new Date(
            a.dueDate
          ).getTime()
        );

      case "priority": {
        const priorityOrder: Record<
          TaskPriority,
          number
        > = {
          High: 1,
          Medium: 2,
          Low: 3,
        };

        return (
          priorityOrder[a.priority] -
          priorityOrder[b.priority]
        );
      }

      default:
        return 0;
    }
  });

  /* =========================================================
     CHECK WHETHER MANUAL DRAG ORDER IS ACTIVE
  ========================================================= */

  const canDrag =
    sortOption === "newest" &&
    searchTerm === "" &&
    statusFilter === "All" &&
    categoryFilter === "All" &&
    priorityFilter === "All" &&
    assigneeFilter === "All" &&
    !overdueFilter;

  /* =========================================================
     APPLY DRAG ORDER
  ========================================================= */

  const orderedTasks = canDrag
    ? [...sortedTasks].sort(
        (a, b) => {
          const aIndex =
            taskOrder.indexOf(
              a.id
            );

          const bIndex =
            taskOrder.indexOf(
              b.id
            );

          if (
            aIndex === -1 &&
            bIndex === -1
          ) {
            return 0;
          }

          if (aIndex === -1) {
            return 1;
          }

          if (bIndex === -1) {
            return -1;
          }

          return (
            aIndex - bIndex
          );
        }
      )
    : sortedTasks;

  /* =========================================================
     SAVE TASK ORDER
  ========================================================= */

  const saveTaskOrder = async (
    newOrder: string[]
  ) => {
    try {
      for (
        let index = 0;
        index < newOrder.length;
        index++
      ) {
        const taskId =
          newOrder[index];

        const task =
          tasks.find(
            (item) =>
              item.id === taskId
          );

        if (!task) {
          continue;
        }

        if (
          task.order === index
        ) {
          continue;
        }

        await updateTask(
          task.id,
          {
            title: task.title,
            description:
              task.description,
            dueDate: task.dueDate,
            category: task.category,
            status: task.status,
            priority: task.priority,
            order: index,
            assignedTo:
              task.assignedTo ??
              null,
          }
        );
      }
    } catch (error) {
      console.error(
        "Failed to save task order:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save task order."
      );
    }
  };

  /* =========================================================
     DRAG END
  ========================================================= */

  const handleDragEnd = async (
    event: DragEndEvent
  ) => {
    const {
      active,
      over,
    } = event;

    if (!canDrag) {
      return;
    }

    if (!over) {
      return;
    }

    if (
      active.id === over.id
    ) {
      return;
    }

    const activeId =
      String(active.id);

    const overId =
      String(over.id);

    const oldIndex =
      taskOrder.indexOf(
        activeId
      );

    const newIndex =
      taskOrder.indexOf(
        overId
      );

    if (
      oldIndex === -1 ||
      newIndex === -1
    ) {
      return;
    }

    const newOrder =
      arrayMove(
        taskOrder,
        oldIndex,
        newIndex
      );

    setTaskOrder(newOrder);

    await saveTaskOrder(
      newOrder
    );
  };

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setPriorityFilter("All");
    setAssigneeFilter("All");
    setOverdueFilter(false);
    setSortOption("newest");
  };

  const hasFilters =
    searchTerm !== "" ||
    statusFilter !== "All" ||
    categoryFilter !== "All" ||
    priorityFilter !== "All" ||
    assigneeFilter !== "All" ||
    overdueFilter;

  /* =========================================================
     TASK TO EDIT
  ========================================================= */

  const taskToEdit =
    selectedTask !== null
      ? tasks.find(
          (task) =>
            task.id ===
            selectedTask
        ) ?? null
      : null;

  /* =========================================================
     DISPLAY STATISTICS
  ========================================================= */

  const totalTasks =
    tasks.length;

  const pendingTasks =
    tasks.filter(
      (task) =>
        task.status === "Pending"
    ).length;

  const inProgressTasks =
    tasks.filter(
      (task) =>
        task.status === "In Progress"
    ).length;

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status === "Completed"
    ).length;

  const overdueTasks =
    tasks.filter(
      (task) =>
        task.dueDate < todayDate &&
        task.status !== "Completed"
    ).length;

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <section className="min-h-[calc(100vh-4rem)] w-full min-w-0 overflow-x-hidden bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="relative mb-7 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 shadow-lg sm:p-8">
          {/* Decorative background */}

          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-indigo-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-50 ring-1 ring-white/20">
                  Workspace
                </span>
              </div>

              <h1 className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                My Tasks
              </h1>

              <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-blue-100 sm:text-base">
                Organize your work, track progress, and stay on top of your deadlines.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedTask(null);
                setShowAddTask(true);
              }}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-xl active:translate-y-0"
            >
              <span className="text-lg leading-none">
                +
              </span>

              <span>
                Add Task
              </span>
            </button>

          </div>
        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Total */}

          <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-blue-50" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Tasks
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {totalTasks}
                </h2>

                <p className="mt-2 text-xs font-medium text-blue-600">
                  All tasks in workspace
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-600">
                ✓
              </div>
            </div>
          </div>

          {/* Pending */}

          <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-amber-50" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {pendingTasks}
                </h2>

                <p className="mt-2 text-xs font-medium text-amber-600">
                  Waiting to be started
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl text-amber-600">
                ◷
              </div>
            </div>
          </div>

          {/* In Progress */}

          <div className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-indigo-50" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  In Progress
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {inProgressTasks}
                </h2>

                <p className="mt-2 text-xs font-medium text-indigo-600">
                  Currently being worked on
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xl text-indigo-600">
                ↗
              </div>
            </div>
          </div>

          {/* Completed */}

          <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-emerald-50" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Completed
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {completedTasks}
                </h2>

                <p className="mt-2 text-xs font-medium text-emerald-600">
                  Successfully finished
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl text-emerald-600">
                ✓
              </div>
            </div>
          </div>

        </div>

        {/* =================================================
            OVERDUE SUMMARY
        ================================================= */}

        {overdueTasks > 0 && (
          <div className="mb-7 flex flex-col gap-4 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">

            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg text-red-600">
                !
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-red-800">
                  {overdueTasks} overdue{" "}
                  {overdueTasks === 1
                    ? "task"
                    : "tasks"}
                </p>

                <p className="mt-1 text-sm text-red-600">
                  These tasks have passed their deadline and are not completed.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setOverdueFilter(true);
                setSearchTerm("");
                setStatusFilter("All");
                setCategoryFilter("All");
                setPriorityFilter("All");
                setAssigneeFilter("All");
                setSortOption("dueSoon");
              }}
              className="shrink-0 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
            >
              View overdue
            </button>

          </div>
        )}

        {/* =================================================
            SEARCH AND FILTERS
        ================================================= */}

        <div className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Filter header */}

          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  ⚙
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">
                    Search & Filters
                  </h3>

                  <p className="text-xs text-slate-400">
                    Find exactly what you need
                  </p>
                </div>
              </div>

              {(hasFilters ||
                sortOption !==
                  "newest") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="self-start rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 sm:self-auto"
                >
                  Clear all
                </button>
              )}

            </div>
          </div>

          {/* Filter body */}

          <div className="p-5 sm:p-6">

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

              {/* SEARCH */}

              <div className="md:col-span-2 xl:col-span-2">
                <label
                  htmlFor="task-search"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Search Tasks
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-slate-400">
                    ⌕
                  </span>

                  <input
                    id="task-search"
                    type="text"
                    placeholder="Search by task title..."
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* STATUS */}

              <div>
                <label
                  htmlFor="task-status-filter"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Status
                </label>

                <select
                  id="task-status-filter"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | "All"
                        | TaskStatus
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="All">
                    All Statuses
                  </option>

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

              {/* CATEGORY */}

              <div>
                <label
                  htmlFor="task-category-filter"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Category
                </label>

                <select
                  id="task-category-filter"
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="All">
                    All Categories
                  </option>

                  {availableCategories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* PRIORITY */}

              <div>
                <label
                  htmlFor="task-priority-filter"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Priority
                </label>

                <select
                  id="task-priority-filter"
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(
                      e.target.value as
                        | "All"
                        | TaskPriority
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="All">
                    All Priorities
                  </option>

                  <option value="High">
                    High
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="Low">
                    Low
                  </option>
                </select>
              </div>

              {/* ASSIGNEE */}

              <div>
                <label
                  htmlFor="task-assignee-filter"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Assignee
                </label>

                <select
                  id="task-assignee-filter"
                  value={assigneeFilter}
                  onChange={(e) =>
                    setAssigneeFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="All">
                    All Assignees
                  </option>

                  <option value="Unassigned">
                    Unassigned
                  </option>

                  {teamMembers.map(
                    (member) => (
                      <option
                        key={member.id}
                        value={member.id}
                      >
                        {member.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* SORT */}

              <div>
                <label
                  htmlFor="task-sort"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Sort By
                </label>

                <select
                  id="task-sort"
                  value={sortOption}
                  onChange={(e) =>
                    setSortOption(
                      e.target.value as SortOption
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="newest">
                    Newest First
                  </option>

                  <option value="oldest">
                    Oldest First
                  </option>

                  <option value="dueSoon">
                    Due Date: Soonest
                  </option>

                  <option value="dueLate">
                    Due Date: Latest
                  </option>

                  <option value="priority">
                    Priority: High to Low
                  </option>
                </select>
              </div>

              {/* OVERDUE */}

              <div className="flex items-end md:col-span-2 xl:col-span-2">
                <label className="flex min-h-[48px] w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-red-200 hover:bg-red-50/60">
                  <input
                    type="checkbox"
                    checked={overdueFilter}
                    onChange={(e) =>
                      setOverdueFilter(
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">
                      Show overdue tasks only
                    </p>

                    <p className="text-xs text-slate-400">
                      Hide completed and upcoming tasks
                    </p>
                  </div>

                  {overdueTasks > 0 && (
                    <span className="ml-auto shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600">
                      {overdueTasks}
                    </span>
                  )}
                </label>
              </div>

            </div>

            {/* Active filter summary */}

            {hasFilters && (
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <span className="mr-1 text-xs font-semibold text-slate-400">
                  Active:
                </span>

                {searchTerm && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    Search: {searchTerm}
                  </span>
                )}

                {statusFilter !== "All" && (
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                    Status: {statusFilter}
                  </span>
                )}

                {categoryFilter !== "All" && (
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                    Category: {categoryFilter}
                  </span>
                )}

                {priorityFilter !== "All" && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    Priority: {priorityFilter}
                  </span>
                )}

                {assigneeFilter !== "All" && (
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                    Assignee:{" "}
                    {assigneeFilter ===
                    "Unassigned"
                      ? "Unassigned"
                      : getAssignedUserName(
                          assigneeFilter
                        ) ||
                        "Team member"}
                  </span>
                )}

                {overdueFilter && (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    Overdue only
                  </span>
                )}
              </div>
            )}

          </div>
        </div>

        {/* =================================================
            TASK LIST
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* List header */}

          <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 px-5 py-5 sm:px-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-lg text-blue-600">
                  ☷
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">
                    Your Tasks
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {canDrag
                      ? "Drag the ⋮⋮ handle to reorder tasks"
                      : "Drag ordering is available in the default task view"}
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {orderedTasks.length} shown
                </span>

                <span className="text-xs text-slate-400">
                  of {tasks.length}
                </span>
              </div>

            </div>
          </div>

          {/* Task content */}

          {orderedTasks.length ===
          0 ? (
            <div className="px-6 py-16 text-center sm:py-20">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
                ✓
              </div>

              <p className="mt-5 font-semibold text-slate-800">
                No tasks found
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                {hasFilters
                  ? "Try changing your search or filters to find more tasks."
                  : "You don't have any tasks yet. Create your first task to get started."}
              </p>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(null);
                    setShowAddTask(true);
                  }}
                  className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  + Create Your First Task
                </button>
              )}

            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={
                closestCenter
              }
              onDragEnd={
                handleDragEnd
              }
            >
              <SortableContext
                items={orderedTasks.map(
                  (task) =>
                    task.id
                )}
                strategy={
                  verticalListSortingStrategy
                }
              >
                <div className="divide-y divide-slate-100">
                  {orderedTasks.map(
                    (task) => (
                      <SortableTask
                        key={task.id}
                        task={task}
                        assignedUserName={getAssignedUserName(
                          task.assignedTo
                        )}
                        onEdit={
                          handleEditTask
                        }
                        onDelete={
                          handleDeleteTask
                        }
                      />
                    )
                  )}
                </div>
              </SortableContext>
            </DndContext>
          )}

        </div>

        {/* =================================================
            ADD / EDIT MODAL
        ================================================= */}

        {showAddTask && (
          <AddTaskModal
            onClose={
              handleCloseModal
            }
            taskToEdit={
              taskToEdit
            }
          />
        )}

      </div>
    </section>
  );
}