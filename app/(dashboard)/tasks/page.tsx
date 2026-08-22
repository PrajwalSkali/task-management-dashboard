"use client";

import { useState } from "react";
import TaskCard from "@/components/TaskCard";
import AddTaskModal from "@/components/AddTaskModal";
import {
  useTasks,
  type TaskStatus,
} from "@/context/TaskContext";

export default function TasksPage() {
  const { tasks, deleteTask } = useTasks();

  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] =
    useState<number | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Status filter
  const [statusFilter, setStatusFilter] = useState<
    "All" | TaskStatus
  >("All");

  // Category filter
  const [categoryFilter, setCategoryFilter] =
    useState("All");

  // Get categories from existing tasks
  const categories = Array.from(
    new Set(tasks.map((task) => task.category))
  );

  // Open Edit Task Modal
  const handleEditTask = (id: number) => {
    setSelectedTask(id);
    setShowAddTask(true);
  };

  // Close Add/Edit Modal
  const handleCloseModal = () => {
    setShowAddTask(false);
    setSelectedTask(null);
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      task.status === statusFilter;

    const matchesCategory =
      categoryFilter === "All" ||
      task.category === categoryFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory
    );
  });

  return (
    <section className="p-6">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            My Tasks
          </h1>

          <p className="mt-1 text-gray-500">
            Manage all your tasks from here.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedTask(null);
            setShowAddTask(true);
          }}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Task
        </button>
      </div>

      {/* Task Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">

        {/* Total Tasks */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Tasks
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {tasks.length}
          </h2>
        </div>

        {/* Pending Tasks */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Pending
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {
              tasks.filter(
                (task) => task.status === "Pending"
              ).length
            }
          </h2>
        </div>

        {/* Completed Tasks */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Completed
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {
              tasks.filter(
                (task) => task.status === "Completed"
              ).length
            }
          </h2>
        </div>

      </div>

      {/* Search and Filters */}
      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search Tasks
            </label>

            <input
              type="text"
              placeholder="Search by task title..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Filter by Status
            </label>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | "All"
                    | TaskStatus
                )
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

          {/* Category Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Filter by Category
            </label>

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">
                All Categories
              </option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Clear Filters */}
        {(searchTerm ||
          statusFilter !== "All" ||
          categoryFilter !== "All") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("All");
              setCategoryFilter("All");
            }}
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Clear Filters
          </button>
        )}

      </div>

      {/* Task List */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

        {/* Task List Header */}
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="font-semibold text-gray-900">
            Tasks
          </h3>

          <span className="text-sm text-gray-500">
            Showing {filteredTasks.length} of{" "}
            {tasks.length}
          </span>
        </div>

        {/* Task Items */}
        {filteredTasks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-gray-700">
              No tasks found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                title={task.title}
                dueDate={task.dueDate}
                status={task.status}
                priority={task.priority}
                onEdit={handleEditTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        )}

      </div>

      {/* Add / Edit Task Modal */}
      {showAddTask && (
        <AddTaskModal
          onClose={handleCloseModal}
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

    </section>
  );
}