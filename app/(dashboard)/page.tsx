"use client";

import DashboardCard from "@/components/DashboardCard";
import TaskCard from "@/components/TaskCard";
import AddTaskModal from "@/components/AddTaskModal";
import { useTasks } from "@/context/TaskContext";
import { useState } from "react";

export default function Home() {
  const { tasks, deleteTask } = useTasks();

  const [showAddTask, setShowAddTask] = useState(false);

  const pendingTasks = tasks.filter(
    (task) => task.status === "Pending"
  );

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  );

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  );

  return (
    <section className="p-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-1 text-gray-500">
          Manage your tasks and stay productive.
        </p>
      </div>

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Tasks"
          value={tasks.length}
        />

        <DashboardCard
          title="Pending"
          value={pendingTasks.length}
        />

        <DashboardCard
          title="In Progress"
          value={inProgressTasks.length}
        />

        <DashboardCard
          title="Completed"
          value={completedTasks.length}
        />
      </div>

      {/* Recent Tasks */}
      <div className="mt-8 overflow-hidden rounded-xl border bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="font-semibold text-gray-900">
            Recent Tasks
          </h3>

          <button
            type="button"
            onClick={() => setShowAddTask(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Task
          </button>
        </div>

        {/* Task List */}
        <div>
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No tasks available.
            </div>
          ) : (
            <div>
              {tasks.map((task) => (
                <TaskCard
                 key={task.id}
                 id={task.id}
                 title={task.title}
                 dueDate={task.dueDate}
                 status={task.status}
                 priority={task.priority}
                 onDelete={deleteTask}
/>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <AddTaskModal
          onClose={() => setShowAddTask(false)}
        />
      )}
    </section>
  );
}