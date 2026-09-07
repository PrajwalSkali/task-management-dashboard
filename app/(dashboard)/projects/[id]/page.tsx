"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import AddTaskModal from "@/components/AddTaskModal";
import TaskComments from "@/components/TaskComments";
import ActivityHistory from "@/components/ActivityHistory";

import type {
  Task,
  TaskPriority,
  TaskStatus,
} from "@/context/TaskContext";

type Project = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  role: "Owner" | "Admin" | "Member";
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

type ProjectMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
  createdAt: string;
};

type ProjectTask = Task & {
  assignedUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  canEdit: boolean;
  canDelete: boolean;
};

type TaskSort =
  | "newest"
  | "oldest"
  | "dueSoon"
  | "dueLate"
  | "priorityHigh"
  | "priorityLow"
  | "titleAZ"
  | "titleZA";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const projectId =
    typeof params.id === "string"
      ? params.id
      : "";

  const [project, setProject] =
    useState<Project | null>(null);

  const [members, setMembers] =
    useState<ProjectMember[]>([]);

  const [projectTasks, setProjectTasks] =
    useState<ProjectTask[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [tasksLoading, setTasksLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedUserId, setSelectedUserId] =
    useState("");

  const [selectedRole, setSelectedRole] =
    useState<"Admin" | "Member">("Member");

  const [availableUsers, setAvailableUsers] =
    useState<
      {
        id: string;
        name: string;
        email: string;
      }[]
    >([]);

  const [addingMember, setAddingMember] =
    useState(false);

  const [updatingMemberId, setUpdatingMemberId] =
    useState("");

  const [removingMemberId, setRemovingMemberId] =
    useState("");

  const [taskToEdit, setTaskToEdit] =
    useState<Task | null>(null);

  const [deletingTaskId, setDeletingTaskId] =
    useState("");

  const [isTaskModalOpen, setIsTaskModalOpen] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | TaskStatus>("All");

  const [priorityFilter, setPriorityFilter] =
    useState<"All" | TaskPriority>("All");

  const [assigneeFilter, setAssigneeFilter] =
    useState("All");

  const [overdueFilter, setOverdueFilter] =
    useState(false);

  const [sortBy, setSortBy] =
    useState<TaskSort>("newest");

  const [draggedTaskId, setDraggedTaskId] =
    useState<string | null>(null);

  const [isReordering, setIsReordering] =
    useState(false);

  const [isEditingProject, setIsEditingProject] =
    useState(false);

  const [projectName, setProjectName] =
    useState("");

  const [projectDescription, setProjectDescription] =
    useState("");

  const [savingProject, setSavingProject] =
    useState(false);

  const [deletingProject, setDeletingProject] =
    useState(false);

  const canManageMembers =
    project?.role === "Owner" ||
    project?.role === "Admin";

  const loadProject = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/projects/${encodeURIComponent(
          projectId
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load project"
        );
      }

      setProject(data);
      setProjectName(data.name || "");
      setProjectDescription(
        data.description || ""
      );
    } catch (error) {
      console.error(
        "FAILED TO LOAD PROJECT:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load project"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(
          projectId
        )}/members`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load project members"
        );
      }

      setMembers(data);
    } catch (error) {
      console.error(
        "FAILED TO LOAD MEMBERS:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load project members"
      );
    }
  };

  const loadUsers = async () => {
    try {
      const response =
        await fetch("/api/users");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load users"
        );
      }

      setAvailableUsers(data);
    } catch (error) {
      console.error(
        "FAILED TO LOAD USERS:",
        error
      );
    }
  };

  const loadProjectTasks = async () => {
    if (!projectId) return;

    try {
      setTasksLoading(true);

      const response = await fetch(
        `/api/projects/${encodeURIComponent(
          projectId
        )}/tasks`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load project tasks"
        );
      }

      setProjectTasks(
        Array.isArray(data?.tasks)
          ? data.tasks
          : []
      );
    } catch (error) {
      console.error(
        "FAILED TO LOAD PROJECT TASKS:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load project tasks"
      );
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (!projectId) return;

    const loadAll = async () => {
      await Promise.all([
        loadProject(),
        loadMembers(),
        loadUsers(),
        loadProjectTasks(),
      ]);
    };

    loadAll();
  }, [projectId]);

  const handleEditProject = () => {
    if (!project || !canManageMembers) return;

    setProjectName(project.name);
    setProjectDescription(
      project.description || ""
    );
    setIsEditingProject(true);
    setError("");
  };

  const handleCancelEditProject = () => {
    if (!project) return;

    setProjectName(project.name);
    setProjectDescription(
      project.description || ""
    );
    setIsEditingProject(false);
  };

  const handleSaveProject = async () => {
    if (
      !projectId ||
      !project ||
      !canManageMembers
    ) {
      return;
    }

    const trimmedName = projectName.trim();
    const trimmedDescription =
      projectDescription.trim();

    if (!trimmedName) {
      setError("Project name is required.");
      return;
    }

    if (trimmedName.length > 100) {
      setError(
        "Project name must be 100 characters or less."
      );
      return;
    }

    if (trimmedDescription.length > 500) {
      setError(
        "Project description must be 500 characters or less."
      );
      return;
    }

    try {
      setSavingProject(true);
      setError("");

      const response = await fetch(
        `/api/projects/${encodeURIComponent(
          projectId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            description:
              trimmedDescription,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update project"
        );
      }

      await loadProject();
      setIsEditingProject(false);
    } catch (error) {
      console.error(
        "FAILED TO UPDATE PROJECT:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update project"
      );
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (
      !projectId ||
      !project ||
      project.role !== "Owner"
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${project.name}"? This will remove the project and its member access. This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingProject(true);
      setError("");

      const response = await fetch(
        `/api/projects/${encodeURIComponent(
          projectId
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to delete project"
        );
      }

      router.push("/projects");
    } catch (error) {
      console.error(
        "FAILED TO DELETE PROJECT:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete project"
      );
    } finally {
      setDeletingProject(false);
    }
  };

  const handleAddMember = async () => {
    if (!projectId || !selectedUserId) {
      return;
    }

    try {
      setAddingMember(true);
      setError("");

      const response = await fetch(
        `/api/projects/${encodeURIComponent(
          projectId
        )}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            userId: selectedUserId,
            role: selectedRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to add member"
        );
      }

      setSelectedUserId("");
      setSelectedRole("Member");

      await loadMembers();
      await loadProject();
    } catch (error) {
      console.error(
        "FAILED TO ADD MEMBER:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to add member"
      );
    } finally {
      setAddingMember(false);
    }
  };

  const handleRoleChange = async (
    memberId: string,
    role: "Admin" | "Member"
  ) => {
    if (!projectId) return;

    try {
      setUpdatingMemberId(memberId);
      setError("");

      const response = await fetch(
        `/api/projects/${encodeURIComponent(
          projectId
        )}/members/${encodeURIComponent(
          memberId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update member role"
        );
      }

      await loadMembers();
    } catch (error) {
      console.error(
        "FAILED TO UPDATE MEMBER ROLE:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update member role"
      );
    } finally {
      setUpdatingMemberId("");
    }
  };

  const handleRemoveMember = async (
    memberId: string,
    memberName: string
  ) => {
    if (!projectId) return;

    const confirmed = window.confirm(
      `Remove ${memberName} from this project?`
    );

    if (!confirmed) return;

    try {
      setRemovingMemberId(memberId);
      setError("");

      const response = await fetch(
        `/api/projects/${encodeURIComponent(
          projectId
        )}/members/${encodeURIComponent(
          memberId
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to remove member"
        );
      }

      await loadMembers();
      await loadProject();
      await loadProjectTasks();
    } catch (error) {
      console.error(
        "FAILED TO REMOVE MEMBER:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to remove member"
      );
    } finally {
      setRemovingMemberId("");
    }
  };

  const handleEditTask = (
    task: ProjectTask
  ) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = async () => {
    setIsTaskModalOpen(false);
    setTaskToEdit(null);

    await loadProjectTasks();
  };

  const handleDeleteTask = async (
    task: ProjectTask
  ) => {
    if (!task.canDelete) return;

    const confirmed = window.confirm(
      `Delete "${task.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingTaskId(task.id);
      setError("");

      const response = await fetch(
        `/api/tasks/${encodeURIComponent(
          task.id
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to delete task"
        );
      }

      await loadProjectTasks();
    } catch (error) {
      console.error(
        "FAILED TO DELETE PROJECT TASK:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete project task"
      );
    } finally {
      setDeletingTaskId("");
    }
  };

  const getStatusStyle = (
    status: ProjectTask["status"]
  ) => {
    if (status === "Completed") {
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    }

    if (status === "In Progress") {
      return "border-amber-100 bg-amber-50 text-amber-700";
    }

    return "border-rose-100 bg-rose-50 text-rose-700";
  };

  const getPriorityStyle = (
    priority: ProjectTask["priority"]
  ) => {
    if (priority === "High") {
      return "border-red-100 bg-red-50 text-red-700";
    }

    if (priority === "Medium") {
      return "border-amber-100 bg-amber-50 text-amber-700";
    }

    return "border-slate-200 bg-slate-50 text-slate-600";
  };

  const isTaskOverdue = (
    task: ProjectTask
  ) => {
    if (
      task.status === "Completed" ||
      !task.dueDate
    ) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(
      `${task.dueDate}T00:00:00`
    );

    if (
      Number.isNaN(dueDate.getTime())
    ) {
      return false;
    }

    return dueDate < today;
  };

  const filteredProjectTasks = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    const priorityRank: Record<
      TaskPriority,
      number
    > = {
      High: 3,
      Medium: 2,
      Low: 1,
    };

    const filtered = projectTasks.filter(
      (task) => {
        const matchesSearch =
          !normalizedSearch ||
          task.title
            .toLowerCase()
            .includes(normalizedSearch) ||
          task.description
            .toLowerCase()
            .includes(normalizedSearch) ||
          task.category
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "All" ||
          task.status === statusFilter;

        const matchesPriority =
          priorityFilter === "All" ||
          task.priority === priorityFilter;

        const matchesAssignee =
          assigneeFilter === "All" ||
          (assigneeFilter === "Unassigned" &&
            !task.assignedTo) ||
          task.assignedTo === assigneeFilter;

        const matchesOverdue =
          !overdueFilter ||
          isTaskOverdue(task);

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesAssignee &&
          matchesOverdue
        );
      }
    );

    return [...filtered].sort(
      (a, b) => {
        if (sortBy === "newest") {
          return a.order - b.order;
        }

        if (sortBy === "titleAZ") {
          return a.title.localeCompare(
            b.title
          );
        }

        if (sortBy === "titleZA") {
          return b.title.localeCompare(
            a.title
          );
        }

        if (sortBy === "priorityHigh") {
          return (
            priorityRank[b.priority] -
            priorityRank[a.priority]
          );
        }

        if (sortBy === "priorityLow") {
          return (
            priorityRank[a.priority] -
            priorityRank[b.priority]
          );
        }

        if (sortBy === "dueSoon") {
          return (
            new Date(a.dueDate).getTime() -
            new Date(b.dueDate).getTime()
          );
        }

        if (sortBy === "dueLate") {
          return (
            new Date(b.dueDate).getTime() -
            new Date(a.dueDate).getTime()
          );
        }

        const aDate = new Date(
          a.createdAt || 0
        ).getTime();

        const bDate = new Date(
          b.createdAt || 0
        ).getTime();

        return sortBy === "oldest"
          ? aDate - bDate
          : bDate - aDate;
      }
    );
  }, [
    projectTasks,
    searchTerm,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    overdueFilter,
    sortBy,
  ]);

  const clearTaskFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setAssigneeFilter("All");
    setOverdueFilter(false);
    setSortBy("newest");
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "All" ||
    priorityFilter !== "All" ||
    assigneeFilter !== "All" ||
    overdueFilter;

  const handleTaskDragStart = (
    taskId: string
  ) => {
    if (
      hasActiveFilters ||
      sortBy !== "newest" ||
      isReordering
    ) {
      return;
    }

    setDraggedTaskId(taskId);
  };

  const handleTaskDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
  };

  const handleTaskDrop = async (
    targetTaskId: string
  ) => {
    if (
      !draggedTaskId ||
      draggedTaskId === targetTaskId ||
      hasActiveFilters ||
      sortBy !== "newest" ||
      isReordering
    ) {
      setDraggedTaskId(null);
      return;
    }

    const currentTasks = [...projectTasks];

    const draggedIndex =
      currentTasks.findIndex(
        (task) =>
          task.id === draggedTaskId
      );

    const targetIndex =
      currentTasks.findIndex(
        (task) =>
          task.id === targetTaskId
      );

    if (
      draggedIndex === -1 ||
      targetIndex === -1
    ) {
      setDraggedTaskId(null);
      return;
    }

    const reorderedTasks = [
      ...currentTasks,
    ];

    const [draggedTask] =
      reorderedTasks.splice(
        draggedIndex,
        1
      );

    reorderedTasks.splice(
      targetIndex,
      0,
      draggedTask
    );

    const updatedTasks =
      reorderedTasks.map(
        (task, index) => ({
          ...task,
          order: index,
        })
      );

    setProjectTasks(updatedTasks);
    setDraggedTaskId(null);

    try {
      setIsReordering(true);
      setError("");

      const responses =
        await Promise.all(
          updatedTasks.map((task) =>
            fetch(
              `/api/tasks/${encodeURIComponent(
                task.id
              )}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  title: task.title,
                  description:
                    task.description,
                  dueDate: task.dueDate,
                  category: task.category,
                  status: task.status,
                  priority: task.priority,
                  projectId:
                    projectId,
                  assignedTo:
                    task.assignedTo ||
                    null,
                  order: task.order,
                }),
              }
            )
          )
        );

      const failedResponse =
        responses.find(
          (response) =>
            !response.ok
        );

      if (failedResponse) {
        throw new Error(
          "One or more task order updates failed."
        );
      }
    } catch (error) {
      console.error(
        "FAILED TO REORDER PROJECT TASKS:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save task order"
      );

      await loadProjectTasks();
    } finally {
      setIsReordering(false);
    }
  };

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null);
  };

  if (loading) {
    return (
      <main className="min-h-full bg-slate-50/60 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
          </div>

          <p className="mt-4 text-sm font-bold text-slate-600">
            Loading project...
          </p>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-full bg-slate-50/60 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl text-red-500">
            ⚠
          </div>

          <h1 className="mt-4 text-lg font-bold text-slate-800">
            Unable to load project
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error ||
              "The project could not be found."}
          </p>

          <Link
            href="/projects"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700"
          >
            Back to Projects
          </Link>
        </div>
      </main>
    );
  }

  const completedTasks =
    projectTasks.filter(
      (task) => task.status === "Completed"
    ).length;

  const overdueTasks =
    projectTasks.filter(
      (task) => isTaskOverdue(task)
    ).length;

  return (
    <main className="min-h-full bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* PROJECT HERO */}
        <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-5 text-white shadow-lg sm:p-7">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 right-24 h-56 w-56 rounded-full bg-white/5" />

          <div className="relative">
            <Link
              href="/projects"
              className="inline-flex items-center rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-50 backdrop-blur transition hover:bg-white/20"
            >
              ← Back to Projects
            </Link>

            <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
                    {project.role}
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                    {members.length} members
                  </span>
                </div>

                <h1 className="break-words text-2xl font-bold tracking-tight sm:text-4xl">
                  {project.name}
                </h1>

                <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-blue-100 sm:text-base">
                  {project.description ||
                    "No project description provided."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {canManageMembers && (
                  <button
                    type="button"
                    onClick={handleEditProject}
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    Edit Project
                  </button>
                )}

                {project.role === "Owner" && (
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    disabled={deletingProject}
                    className="rounded-xl border border-red-200/30 bg-red-500/20 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingProject
                      ? "Deleting..."
                      : "Delete Project"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-600">
            <span className="shrink-0">⚠</span>
            <span className="break-words">
              {error}
            </span>
          </div>
        )}

        {/* EDIT PROJECT */}
        {isEditingProject && (
          <section className="mb-6 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
              <h2 className="font-bold text-slate-800">
                Edit Project
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Owners and admins can update project details.
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Project Name
                </label>

                <input
                  type="text"
                  value={projectName}
                  onChange={(event) =>
                    setProjectName(
                      event.target.value
                    )
                  }
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter project name"
                />

                <p className="mt-1.5 text-right text-xs text-slate-400">
                  {projectName.length}/100
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Description
                </label>

                <textarea
                  value={projectDescription}
                  onChange={(event) =>
                    setProjectDescription(
                      event.target.value
                    )
                  }
                  maxLength={500}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="Describe the project"
                />

                <p className="mt-1.5 text-right text-xs text-slate-400">
                  {projectDescription.length}/500
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancelEditProject}
                  disabled={savingProject}
                  className="w-full rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveProject}
                  disabled={
                    savingProject ||
                    !projectName.trim()
                  }
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {savingProject
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* SUMMARY */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Your Role
            </p>
            <p className="mt-2 truncate text-lg font-bold text-slate-800">
              {project.role}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Members
            </p>
            <p className="mt-2 text-lg font-bold text-slate-800">
              {members.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Tasks
            </p>
            <p className="mt-2 text-lg font-bold text-slate-800">
              {projectTasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Completed
            </p>
            <p className="mt-2 text-lg font-bold text-emerald-600">
              {completedTasks}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Overdue
            </p>
            <p
              className={`mt-2 text-lg font-bold ${
                overdueTasks > 0
                  ? "text-red-600"
                  : "text-slate-800"
              }`}
            >
              {overdueTasks}
            </p>
          </div>
        </div>

        {/* PROJECT TASKS */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/40 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    ✓
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-800">
                      Project Tasks
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Tasks shared within this project.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!hasActiveFilters &&
                  sortBy === "newest" &&
                  projectTasks.length > 1 && (
                    <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                      ⋮⋮ Drag to reorder
                    </span>
                  )}

                {isReordering && (
                  <span className="inline-flex items-center rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600">
                    Saving order...
                  </span>
                )}

                <Link
                  href="/tasks"
                  className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  Manage Tasks →
                </Link>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          {!tasksLoading &&
            projectTasks.length > 0 && (
              <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      ⌕
                    </span>

                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(
                          event.target.value
                        )
                      }
                      placeholder="Search project tasks..."
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as
                          | "All"
                          | TaskStatus
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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

                  <select
                    value={priorityFilter}
                    onChange={(event) =>
                      setPriorityFilter(
                        event.target.value as
                          | "All"
                          | TaskPriority
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="All">
                      All Priorities
                    </option>
                    <option value="High">
                      High Priority
                    </option>
                    <option value="Medium">
                      Medium Priority
                    </option>
                    <option value="Low">
                      Low Priority
                    </option>
                  </select>

                  <select
                    value={assigneeFilter}
                    onChange={(event) =>
                      setAssigneeFilter(
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="All">
                      All Assignees
                    </option>

                    <option value="Unassigned">
                      Unassigned
                    </option>

                    {members.map((member) => (
                      <option
                        key={member.userId}
                        value={member.userId}
                      >
                        {member.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(
                        event.target.value as TaskSort
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="newest">
                      Newest First
                    </option>
                    <option value="oldest">
                      Oldest First
                    </option>
                    <option value="dueSoon">
                      Deadline: Soonest
                    </option>
                    <option value="dueLate">
                      Deadline: Latest
                    </option>
                    <option value="priorityHigh">
                      Priority: High → Low
                    </option>
                    <option value="priorityLow">
                      Priority: Low → High
                    </option>
                    <option value="titleAZ">
                      Title: A → Z
                    </option>
                    <option value="titleZA">
                      Title: Z → A
                    </option>
                  </select>

                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={overdueFilter}
                      onChange={(event) =>
                        setOverdueFilter(
                          event.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                    Show overdue only
                  </label>

                  <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-500">
                    Showing
                    <span className="mx-1 font-bold text-slate-800">
                      {filteredProjectTasks.length}
                    </span>
                    of
                    <span className="mx-1 font-bold text-slate-800">
                      {projectTasks.length}
                    </span>
                    tasks
                  </div>

                  {hasActiveFilters && (
                    <div className="flex items-center justify-start lg:justify-end">
                      <button
                        type="button"
                        onClick={clearTaskFilters}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* TASK CONTENT */}
          {tasksLoading ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Loading project tasks...
              </p>
            </div>
          ) : projectTasks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
                ✓
              </div>

              <p className="mt-4 text-sm font-bold text-slate-600">
                No tasks in this project yet.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Create a task and select this project
                to see it here.
              </p>
            </div>
          ) : filteredProjectTasks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
                ⌕
              </div>

              <p className="mt-4 text-sm font-bold text-slate-600">
                No tasks match your filters.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Try changing your search or filters.
              </p>

              <button
                type="button"
                onClick={clearTaskFilters}
                className="mt-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredProjectTasks.map(
                (task) => {
                  const overdue =
                    isTaskOverdue(task);

                  const canDrag =
                    !hasActiveFilters &&
                    sortBy === "newest" &&
                    !isReordering;

                  return (
                    <div
                      key={task.id}
                      draggable={canDrag}
                      onDragStart={() =>
                        handleTaskDragStart(
                          task.id
                        )
                      }
                      onDragOver={
                        canDrag
                          ? handleTaskDragOver
                          : undefined
                      }
                      onDrop={
                        canDrag
                          ? () =>
                              handleTaskDrop(
                                task.id
                              )
                          : undefined
                      }
                      onDragEnd={
                        handleTaskDragEnd
                      }
                      className={`p-4 transition sm:p-5 ${
                        overdue
                          ? "bg-red-50/40"
                          : "bg-white hover:bg-slate-50/60"
                      } ${
                        draggedTaskId ===
                        task.id
                          ? "scale-[0.99] opacity-50"
                          : ""
                      } ${
                        canDrag
                          ? "cursor-grab active:cursor-grabbing"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {canDrag && (
                              <span
                                className="select-none rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-400"
                                title="Drag to reorder"
                              >
                                ⋮⋮
                              </span>
                            )}

                            <h3 className="break-words text-base font-bold text-slate-800">
                              {task.title}
                            </h3>

                            {overdue && (
                              <span className="rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700">
                                Overdue
                              </span>
                            )}
                          </div>

                          {task.description && (
                            <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-500">
                              {task.description}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                              {task.category}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                task.status
                              )}`}
                            >
                              {task.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 xl:min-w-[280px] xl:items-end">
                          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                            <span className="text-xs font-medium text-slate-400">
                              Due
                            </span>

                            <span
                              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                                overdue
                                  ? "bg-red-50 text-red-600"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {task.dueDate}
                            </span>
                          </div>

                          {task.assignedUser ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">
                                Assigned to
                              </span>

                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                {task.assignedUser.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">
                              Unassigned
                            </span>
                          )}

                          {(task.canEdit ||
                            task.canDelete) && (
                            <div className="flex flex-wrap gap-2">
                              {task.canEdit && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditTask(
                                      task
                                    )
                                  }
                                  className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                                >
                                  Edit
                                </button>
                              )}

                              {task.canDelete && (
                                <button
                                  type="button"
                                  disabled={
                                    deletingTaskId ===
                                    task.id
                                  }
                                  onClick={() =>
                                    handleDeleteTask(
                                      task
                                    )
                                  }
                                  className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {deletingTaskId ===
                                  task.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <TaskComments
                        taskId={task.id}
                      />
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* PROJECT ACTIVITY */}
        <section className="mb-6">
          <ActivityHistory
            projectId={project.id}
            limit={20}
          />
        </section>

        {/* ADD MEMBER */}
        {canManageMembers && (
          <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-white to-purple-50/50 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  +
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">
                    Add Project Member
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Add a registered user to this project.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-5 md:grid-cols-[1fr_180px_auto] sm:p-6">
              <select
                value={selectedUserId}
                onChange={(event) =>
                  setSelectedUserId(
                    event.target.value
                  )
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  Select team member
                </option>

                {availableUsers
                  .filter(
                    (user) =>
                      !members.some(
                        (member) =>
                          member.userId ===
                          user.id
                      )
                  )
                  .map((user) => (
                    <option
                      key={user.id}
                      value={user.id}
                    >
                      {user.name} —{" "}
                      {user.email}
                    </option>
                  ))}
              </select>

              <select
                value={selectedRole}
                onChange={(event) =>
                  setSelectedRole(
                    event.target.value as
                      | "Admin"
                      | "Member"
                  )
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="Member">
                  Member
                </option>
                <option value="Admin">
                  Admin
                </option>
              </select>

              <button
                type="button"
                onClick={handleAddMember}
                disabled={
                  !selectedUserId ||
                  addingMember
                }
                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-purple-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingMember
                  ? "Adding..."
                  : "Add Member"}
              </button>
            </div>
          </section>
        )}

        {/* MEMBERS */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-white to-indigo-50/40 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                👥
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Project Members
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  People who have access to this project.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {members.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                No project members found.
              </div>
            ) : (
              members.map((member) => {
                const isOwner =
                  member.role === "Owner";

                const initial = member.name
                  .charAt(0)
                  .toUpperCase();

                return (
                  <div
                    key={member.id}
                    className="flex flex-col gap-4 p-4 transition hover:bg-slate-50 sm:p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${
                          isOwner
                            ? "bg-gradient-to-br from-purple-500 to-violet-600"
                            : "bg-gradient-to-br from-blue-500 to-indigo-600"
                        }`}
                      >
                        {initial}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-800">
                          {member.name}
                        </h3>

                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {member.email}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          Joined{" "}
                          {new Date(
                            member.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isOwner ? (
                        <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                          Owner
                        </span>
                      ) : (
                        <>
                          {canManageMembers ? (
                            <select
                              value={
                                member.role
                              }
                              disabled={
                                updatingMemberId ===
                                member.id
                              }
                              onChange={(event) =>
                                handleRoleChange(
                                  member.id,
                                  event.target
                                    .value as
                                    | "Admin"
                                    | "Member"
                                )
                              }
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                              <option value="Member">
                                Member
                              </option>

                              <option value="Admin">
                                Admin
                              </option>
                            </select>
                          ) : (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                              {member.role}
                            </span>
                          )}

                          {canManageMembers && (
                            <button
                              type="button"
                              disabled={
                                removingMemberId ===
                                member.id
                              }
                              onClick={() =>
                                handleRemoveMember(
                                  member.id,
                                  member.name
                                )
                              }
                              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {removingMemberId ===
                              member.id
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* EDIT TASK MODAL */}
      {isTaskModalOpen && (
        <AddTaskModal
          taskToEdit={taskToEdit}
          onClose={handleCloseTaskModal}
        />
      )}
    </main>
  );
}