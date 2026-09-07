"use client";

import DashboardCard from "@/components/DashboardCard";
import TaskCard from "@/components/TaskCard";
import AddTaskModal from "@/components/AddTaskModal";
import ActivityHistory from "@/components/ActivityHistory";
import { useTasks } from "@/context/TaskContext";
import { useState } from "react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function Home() {
  const { tasks, deleteTask } = useTasks();

  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const today = new Date();

  const todayDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // ==========================================
  // TASK STATISTICS
  // ==========================================

  const pendingTasks = tasks.filter(
    (task) => task.status === "Pending"
  );

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  );

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  );

  // ==========================================
  // DEADLINE STATISTICS
  // ==========================================

  const overdueTasks = tasks.filter(
    (task) =>
      task.dueDate < todayDate &&
      task.status !== "Completed"
  );

  const dueTodayTasks = tasks.filter(
    (task) =>
      task.dueDate === todayDate &&
      task.status !== "Completed"
  );

  const upcomingTasks = tasks.filter(
    (task) =>
      task.dueDate > todayDate &&
      task.status !== "Completed"
  );

  // ==========================================
  // PRIORITY STATISTICS
  // ==========================================

  const lowPriorityTasks = tasks.filter(
    (task) => task.priority === "Low"
  );

  const mediumPriorityTasks = tasks.filter(
    (task) => task.priority === "Medium"
  );

  const highPriorityTasks = tasks.filter(
    (task) => task.priority === "High"
  );

  // ==========================================
  // CHART DATA
  // ==========================================

  const statusData = [
    {
      name: "Pending",
      value: pendingTasks.length,
    },
    {
      name: "In Progress",
      value: inProgressTasks.length,
    },
    {
      name: "Completed",
      value: completedTasks.length,
    },
  ];

  const priorityData = [
    {
      name: "Low",
      tasks: lowPriorityTasks.length,
    },
    {
      name: "Medium",
      tasks: mediumPriorityTasks.length,
    },
    {
      name: "High",
      tasks: highPriorityTasks.length,
    },
  ];

  const deadlineData = [
    {
      name: "Overdue",
      tasks: overdueTasks.length,
    },
    {
      name: "Due Today",
      tasks: dueTodayTasks.length,
    },
    {
      name: "Upcoming",
      tasks: upcomingTasks.length,
    },
  ];

  const chartColors = [
    "#f97316",
    "#6366f1",
    "#22c55e",
  ];

  const deadlineColors = [
    "#ef4444",
    "#f59e0b",
    "#22c55e",
  ];

  const completionRate =
    tasks.length > 0
      ? Math.round(
          (completedTasks.length / tasks.length) * 100
        )
      : 0;

  const openTaskCount =
    pendingTasks.length + inProgressTasks.length;

  // ==========================================
  // OPEN CREATE TASK MODAL
  // ==========================================

  const openCreateTask = () => {
    setSelectedTask(null);
    setShowAddTask(true);
  };

  // ==========================================
  // DASHBOARD
  // ==========================================

  return (
    <section className="min-h-full w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1600px]">

        {/* ======================================
            HERO
        ====================================== */}

        <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-5 text-white shadow-lg sm:p-7 lg:p-8">

          <div className="relative z-10 max-w-3xl">

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Productivity Overview
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Manage your tasks, monitor your progress,
              and stay on top of every deadline.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={openCreateTask}
                className="w-full rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 hover:shadow-md sm:w-auto"
              >
                + Create New Task
              </button>

              <div className="flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur-sm">
                {openTaskCount} active{" "}
                {openTaskCount === 1 ? "task" : "tasks"}
              </div>
            </div>
          </div>

          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 right-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute right-12 top-1/2 hidden h-20 w-20 -translate-y-1/2 rounded-3xl border border-white/10 bg-white/5 lg:block" />
        </div>

        {/* ======================================
            OVERVIEW HEADER
        ====================================== */}

        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Overview
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              Task performance
            </h2>
          </div>

          <div className="hidden rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-500 shadow-sm sm:block">
            {tasks.length} total{" "}
            {tasks.length === 1 ? "task" : "tasks"}
          </div>
        </div>

        {/* ======================================
            STATISTICS
        ====================================== */}

        <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Total */}
          <div className="group min-w-0 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-blue-600">
                  Total Tasks
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {tasks.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  All your tasks
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg text-white shadow-sm transition group-hover:scale-105">
                📋
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="group min-w-0 overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-orange-600">
                  Pending
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {pendingTasks.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Waiting to start
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-lg text-white shadow-sm transition group-hover:scale-105">
                ⏳
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="group min-w-0 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-indigo-600">
                  In Progress
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {inProgressTasks.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Currently working
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white shadow-sm transition group-hover:scale-105">
                🚀
              </div>
            </div>
          </div>

          {/* Completed */}
          <div className="group min-w-0 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-emerald-600">
                  Completed
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {completedTasks.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Successfully finished
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-lg text-white shadow-sm transition group-hover:scale-105">
                ✓
              </div>
            </div>
          </div>
        </div>

        {/* ======================================
            DEADLINE SUMMARY
        ====================================== */}

        <div className="mt-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">

          {/* Overdue */}
          <div className="group min-w-0 rounded-2xl border border-red-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  ⚠
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Overdue
                  </p>

                  <p className="mt-1 text-2xl font-bold text-red-600">
                    {overdueTasks.length}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
                Attention
              </span>
            </div>
          </div>

          {/* Due Today */}
          <div className="group min-w-0 rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  📅
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Due Today
                  </p>

                  <p className="mt-1 text-2xl font-bold text-amber-600">
                    {dueTodayTasks.length}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600">
                Today
              </span>
            </div>
          </div>

          {/* Upcoming */}
          <div className="group min-w-0 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  🗓
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Upcoming
                  </p>

                  <p className="mt-1 text-2xl font-bold text-emerald-600">
                    {upcomingTasks.length}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                Planned
              </span>
            </div>
          </div>
        </div>

        {/* ======================================
            ANALYTICS
        ====================================== */}

        <div className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Analytics
            </p>

            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Understand your workload
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  See progress, priorities, and upcoming deadlines at a glance.
                </p>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">
                {completionRate}% completed
              </div>
            </div>
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">

            {/* Status */}
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />

                  <h3 className="font-bold text-slate-900">
                    Task Status
                  </h3>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  See how your tasks are progressing.
                </p>
              </div>

              {tasks.length === 0 ? (
                <div className="flex h-[260px] items-center justify-center text-center text-sm text-slate-400">
                  No task data available.
                </div>
              ) : (
                <div className="h-[260px] w-full min-w-0 sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius="65%"
                        dataKey="value"
                        nameKey="name"
                        label
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`status-${entry.name}`}
                            fill={
                              chartColors[
                                index % chartColors.length
                              ]
                            }
                          />
                        ))}
                      </Pie>

                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />

                  <h3 className="font-bold text-slate-900">
                    Task Priority
                  </h3>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Number of tasks by priority level.
                </p>
              </div>

              {tasks.length === 0 ? (
                <div className="flex h-[260px] items-center justify-center text-center text-sm text-slate-400">
                  No task data available.
                </div>
              ) : (
                <div className="h-[260px] w-full min-w-0 sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={priorityData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                      />

                      <XAxis
                        dataKey="name"
                        tick={{
                          fill: "#64748b",
                          fontSize: 12,
                        }}
                      />

                      <YAxis
                        allowDecimals={false}
                        tick={{
                          fill: "#64748b",
                          fontSize: 12,
                        }}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="tasks"
                        name="Tasks"
                        fill="#6366f1"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Deadline */}
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2">
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                  <h3 className="font-bold text-slate-900">
                    Deadline Overview
                  </h3>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Keep track of overdue, today's, and upcoming work.
                </p>
              </div>

              {tasks.length === 0 ? (
                <div className="flex h-[260px] items-center justify-center text-center text-sm text-slate-400">
                  No deadline data available.
                </div>
              ) : (
                <div className="h-[260px] w-full min-w-0 sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={deadlineData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                      />

                      <XAxis
                        dataKey="name"
                        tick={{
                          fill: "#64748b",
                          fontSize: 12,
                        }}
                      />

                      <YAxis
                        allowDecimals={false}
                        tick={{
                          fill: "#64748b",
                          fontSize: 12,
                        }}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="tasks"
                        name="Tasks"
                        radius={[6, 6, 0, 0]}
                      >
                        {deadlineData.map((entry, index) => (
                          <Cell
                            key={`deadline-${entry.name}`}
                            fill={
                              deadlineColors[
                                index %
                                  deadlineColors.length
                              ]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================
            RECENT TASKS
        ====================================== */}

        <div className="mt-8 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 p-4 sm:p-5">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />

                  <h2 className="font-bold text-slate-900">
                    Recent Tasks
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Your current tasks and their latest status.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateTask}
                className="w-full shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md sm:w-auto"
              >
                + Add Task
              </button>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden">

            {tasks.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                  📋
                </div>

                <p className="mt-4 font-bold text-slate-700">
                  No tasks yet
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Create your first task to get started.
                </p>

                <button
                  type="button"
                  onClick={openCreateTask}
                  className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Create Task
                </button>
              </div>
            ) : (
              <div className="min-w-0 max-w-full overflow-hidden [&>*]:min-w-0 [&>*]:max-w-full">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    dueDate={task.dueDate}
                    status={task.status}
                    priority={task.priority}
                    assignedTo={task.assignedTo}
                    onDelete={deleteTask}
                    onEdit={(id) => {
                      setSelectedTask(id);
                      setShowAddTask(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ======================================
            ACTIVITY HISTORY
        ====================================== */}

        <div className="mt-8 min-w-0 max-w-full">

          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Timeline
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              Recent Activity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              See the latest changes across your workspace.
            </p>
          </div>

          {/* Only recent 5 initially.
              ActivityHistory provides Show All. */}
          <ActivityHistory limit={5} />
        </div>

        {/* ======================================
            ADD / EDIT TASK MODAL
        ====================================== */}

        {showAddTask && (
          <AddTaskModal
            onClose={() => {
              setShowAddTask(false);
              setSelectedTask(null);
            }}
            taskToEdit={
              selectedTask !== null
                ? tasks.find(
                    (task) =>
                      task.id === selectedTask
                  ) ?? null
                : null
            }
          />
        )}
      </div>
    </section>
  );
}