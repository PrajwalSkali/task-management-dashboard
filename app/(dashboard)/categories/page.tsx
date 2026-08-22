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

  const [newCategory, setNewCategory] = useState("");

  const getTaskCount = (category: string) => {
    return tasks.filter(
      (task) => task.category === category
    ).length;
  };

  const handleAddCategory = () => {
    const category = newCategory.trim();

    if (!category) {
      alert("Please enter a category name.");
      return;
    }

    if (
      categories.some(
        (item) =>
          item.toLowerCase() === category.toLowerCase()
      )
    ) {
      alert("This category already exists.");
      return;
    }

    addCategory(category);
    setNewCategory("");
  };

  const handleDeleteCategory = (category: string) => {
    const taskCount = getTaskCount(category);

    if (taskCount > 0) {
      alert(
        `Cannot delete "${category}" because it has ${taskCount} ${
          taskCount === 1 ? "task" : "tasks"
        } assigned to it.`
      );
      return;
    }

    deleteCategory(category);
  };

  return (
    <section className="p-6">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Categories
        </h1>

        <p className="mt-1 text-gray-500">
          Organize your tasks using categories.
        </p>
      </div>

      {/* Add Category */}
      <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Add New Category
        </h2>

        <div className="mt-4 flex gap-3">
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
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <button
            type="button"
            onClick={handleAddCategory}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="border-b p-5">
          <h2 className="font-semibold text-gray-900">
            All Categories
          </h2>
        </div>

        {categories.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No categories available.
          </div>
        ) : (
          <div>
            {categories.map((category) => {
              const taskCount =
                getTaskCount(category);

              return (
                <div
                  key={category}
                  className="flex items-center justify-between border-b p-5 last:border-b-0"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {category}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {taskCount}{" "}
                      {taskCount === 1
                        ? "task"
                        : "tasks"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteCategory(category)
                    }
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </section>
  );
}