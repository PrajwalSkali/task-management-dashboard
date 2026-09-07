"use client";

import { useEffect, useState } from "react";

type TeamMember = {
  id: string;
  name: string;
  email: string;
};

type TaskOwner = {
  id: string;
  name: string;
  email: string;
};

type Task = {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string;
  category: string;
  status:
    | "Pending"
    | "In Progress"
    | "Completed";
  priority:
    | "Low"
    | "Medium"
    | "High";
  order: number;
  projectId?: string | null;
  assignedTo?: string | null;
  owner?: TaskOwner | null;
};

export default function TeamPage() {
  const [teamMembers, setTeamMembers] =
    useState<TeamMember[]>([]);

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadTeamWorkspace = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          usersResponse,
          tasksResponse,
        ] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/team/tasks"),
        ]);

        if (!usersResponse.ok) {
          throw new Error(
            "Failed to fetch team members"
          );
        }

        if (!tasksResponse.ok) {
          throw new Error(
            "Failed to fetch assigned tasks"
          );
        }

        const usersData =
          await usersResponse.json();

        const tasksData =
          await tasksResponse.json();

        setTeamMembers(
          Array.isArray(usersData)
            ? usersData
            : []
        );

        setTasks(
          Array.isArray(tasksData)
            ? tasksData
            : []
        );
      } catch (err) {
        console.error(
          "TEAM WORKSPACE LOAD ERROR:",
          err
        );

        setError(
          "Unable to load team workspace. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadTeamWorkspace();
  }, []);

  const getStatusClasses = (
    status: Task["status"]
  ) => {
    switch (status) {
      case "Completed":
        return "border-emerald-100 bg-emerald-50 text-emerald-700";

      case "In Progress":
        return "border-blue-100 bg-blue-50 text-blue-700";

      default:
        return "border-amber-100 bg-amber-50 text-amber-700";
    }
  };

  const getPriorityClasses = (
    priority: Task["priority"]
  ) => {
    switch (priority) {
      case "High":
        return "border-red-100 bg-red-50 text-red-700";

      case "Medium":
        return "border-orange-100 bg-orange-50 text-orange-700";

      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  };

  const isOverdue = (task: Task) => {
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

  const completedTaskCount =
    tasks.filter(
      (task) =>
        task.status === "Completed"
    ).length;

  const inProgressTaskCount =
    tasks.filter(
      (task) =>
        task.status === "In Progress"
    ).length;

  const overdueTaskCount =
    tasks.filter((task) =>
      isOverdue(task)
    ).length;

  const pendingTaskCount =
    tasks.filter(
      (task) =>
        task.status === "Pending"
    ).length;

  const formatDueDate = (
    dueDate: string
  ) => {
    if (!dueDate) {
      return "No date";
    }

    const date = new Date(
      `${dueDate}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }

    return date.toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  return (
    <main className="min-h-full bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* ======================================
            HEADER
        ====================================== */}

        <div className="mb-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                Team Workspace
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Team Workspace
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Collaborate with your team and
                stay on top of tasks assigned to
                you.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                👥
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Workspace
                </p>

                <p className="text-sm font-bold text-slate-700">
                  {loading
                    ? "Loading..."
                    : `${teamMembers.length} members`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================
            SUMMARY CARDS
        ====================================== */}

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                👥
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">
                  Team Members
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-800">
                  {loading
                    ? "—"
                    : teamMembers.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                ✓
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">
                  Assigned Tasks
                </p>

                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {loading
                    ? "—"
                    : tasks.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                ◷
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">
                  In Progress
                </p>

                <p className="mt-1 text-2xl font-bold text-amber-600">
                  {loading
                    ? "—"
                    : inProgressTaskCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                ✓
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">
                  Completed
                </p>

                <p className="mt-1 text-2xl font-bold text-emerald-600">
                  {loading
                    ? "—"
                    : completedTaskCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  overdueTaskCount > 0
                    ? "bg-red-50 text-red-600"
                    : "bg-slate-50 text-slate-500"
                }`}
              >
                !
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">
                  Overdue
                </p>

                <p
                  className={`mt-1 text-2xl font-bold ${
                    overdueTaskCount > 0
                      ? "text-red-600"
                      : "text-slate-700"
                  }`}
                >
                  {loading
                    ? "—"
                    : overdueTaskCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================
            ERROR
        ====================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-600">
            <span className="shrink-0">
              ⚠
            </span>

            <span className="break-words">
              {error}
            </span>
          </div>
        )}

        {/* ======================================
            ASSIGNED TASKS
        ====================================== */}

        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/40 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  ✓
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">
                    My Assigned Tasks
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Tasks assigned to your account
                    by team members.
                  </p>
                </div>
              </div>

              {!loading &&
                tasks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      {pendingTaskCount} pending
                    </span>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      {completedTaskCount} completed
                    </span>
                  </div>
                )}
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-600">
                Loading assigned tasks...
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
                ✓
              </div>

              <p className="mt-4 text-sm font-bold text-slate-600">
                No assigned tasks
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Tasks assigned to you will appear
                here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => {
                const overdue =
                  isOverdue(task);

                return (
                  <div
                    key={task.id}
                    className={`p-4 transition sm:p-5 ${
                      overdue
                        ? "bg-red-50/30"
                        : "hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

                      {/* Task Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
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

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                            {task.category}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityClasses(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                          <span
                            className={
                              overdue
                                ? "font-bold text-red-600"
                                : ""
                            }
                          >
                            Due:{" "}
                            {formatDueDate(
                              task.dueDate
                            )}
                          </span>

                          <span>
                            Assigned to: You
                          </span>

                          {task.projectId && (
                            <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-600">
                              Project Task
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Side */}
                      <div className="flex shrink-0 flex-col gap-3 xl:min-w-[230px] xl:items-end">

                        <div className="flex items-center gap-2 xl:justify-end">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            📅
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              Due Date
                            </p>

                            <p
                              className={`text-sm font-bold ${
                                overdue
                                  ? "text-red-600"
                                  : "text-slate-700"
                              }`}
                            >
                              {formatDueDate(
                                task.dueDate
                              )}
                            </p>
                          </div>
                        </div>

                        {task.owner && (
                          <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 xl:max-w-[260px]">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                              {task.owner.name
                                ? task.owner.name
                                    .charAt(0)
                                    .toUpperCase()
                                : "?"}
                            </div>

                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Task Owner
                              </p>

                              <p className="truncate text-sm font-bold text-slate-700">
                                {task.owner.name ||
                                  "Unknown"}
                              </p>

                              {task.owner.email && (
                                <p className="truncate text-xs text-slate-400">
                                  {task.owner.email}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ======================================
            TEAM MEMBERS
        ====================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 bg-gradient-to-r from-white to-purple-50/40 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                👥
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Team Members
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Members available for task
                  collaboration.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-[3px] border-purple-100 border-t-purple-600" />

              <p className="mt-3 text-sm text-slate-500">
                Loading team members...
              </p>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
                👥
              </div>

              <p className="mt-4 text-sm font-bold text-slate-600">
                No team members found.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map(
                (member) => {
                  const initial =
                    member.name
                      .charAt(0)
                      .toUpperCase();

                  return (
                    <div
                      key={member.id}
                      className="group rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-purple-200 hover:bg-purple-50/20 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                          {initial}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">
                            {member.name}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs font-medium text-slate-400">
                          Team Member
                        </span>

                        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                          Active
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}