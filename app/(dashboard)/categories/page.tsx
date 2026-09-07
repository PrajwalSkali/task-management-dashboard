"use client";

import { useState } from "react";
import { useTasks } from "@/context/TaskContext";

export default function CategoriesPage() {
  const {
    tasks,
    categories,
    addCategory,
    deleteCategory,
  } = useTasks();

  const [newCategory, setNewCategory] =
    useState("");

  const getTaskCount = (category: string) => {
    return tasks.filter(
      (task) => task.category === category
    ).length;
  };

  const handleAddCategory = async () => {
    const category = newCategory.trim();

    if (!category) {
      alert("Please enter a category name.");
      return;
    }

    try {
      await addCategory(category);
      setNewCategory("");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to add category."
      );
    }
  };

  const handleDeleteCategory = async (
    category: string
  ) => {
    const taskCount =
      getTaskCount(category);

    if (taskCount > 0) {
      alert(
        `Cannot delete "${category}" because it has ${taskCount} ${
          taskCount === 1
            ? "task"
            : "tasks"
        } assigned to it.`
      );
      return;
    }

    try {
      await deleteCategory(category);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete category."
      );
    }
  };

  return (
    <main className="min-h-full bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Organization
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Categories
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                Organize your tasks and keep your
                workspace easy to navigate.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Total Categories
              </p>

              <p className="mt-1 text-xl font-bold text-emerald-600">
                {categories.length}
              </p>
            </div>
          </div>
        </div>

        {/* Add Category */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white shadow-sm">
                +
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Add New Category
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Create a category for your tasks.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:p-6">
            <input
              type="text"
              value={newCategory}
              onChange={(e) =>
                setNewCategory(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddCategory();
                }
              }}
              placeholder="Enter category name"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />

            <button
              type="button"
              onClick={handleAddCategory}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:from-emerald-700 hover:to-teal-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:w-auto"
            >
              + Add Category
            </button>
          </div>
        </section>

        {/* Categories */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-white to-emerald-50/40 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  ◈
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">
                    All Categories
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Manage the categories used by your tasks.
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                {categories.length}
              </span>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
                ◈
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-600">
                No categories available
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Add your first category above to
                organize your tasks.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
              {categories.map(
                (category) => {
                  const taskCount =
                    getTaskCount(category);

                  return (
                    <div
                      key={category}
                      className="group rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/20 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
                            ◈
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-slate-800">
                              {category}
                            </h3>

                            <p className="mt-1 text-xs text-slate-400">
                              {taskCount}{" "}
                              {taskCount === 1
                                ? "task"
                                : "tasks"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                            taskCount > 0
                              ? "bg-blue-50 text-blue-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {taskCount > 0
                            ? "In use"
                            : "Unused"}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[11px] text-slate-400">
                          {taskCount > 0
                            ? "Used by tasks"
                            : "Ready to use"}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteCategory(
                              category
                            )
                          }
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-100"
                        >
                          Delete
                        </button>
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