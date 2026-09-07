"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Project = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  role: "Owner" | "Admin" | "Member";
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/projects");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to fetch projects"
        );
      }

      setProjects(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to load projects:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load projects."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    const trimmedName = name.trim();
    const trimmedDescription =
      description.trim();

    if (!trimmedName) {
      setError("Project name is required.");
      return;
    }

    if (trimmedName.length > 100) {
      setError(
        "Project name cannot exceed 100 characters."
      );
      return;
    }

    if (trimmedDescription.length > 500) {
      setError(
        "Project description cannot exceed 500 characters."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(
        "/api/projects",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            description: trimmedDescription,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create project"
        );
      }

      setProjects((current) => [
        data,
        ...current,
      ]);

      setName("");
      setDescription("");
      setShowCreateForm(false);
    } catch (error) {
      console.error(
        "Failed to create project:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create project."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleStyle = (
    role: Project["role"]
  ) => {
    switch (role) {
      case "Owner":
        return {
          badge:
            "border-purple-100 bg-purple-50 text-purple-700",
          icon:
            "from-purple-500 to-violet-600",
        };

      case "Admin":
        return {
          badge:
            "border-blue-100 bg-blue-50 text-blue-700",
          icon:
            "from-blue-500 to-indigo-600",
        };

      default:
        return {
          badge:
            "border-slate-200 bg-slate-50 text-slate-600",
          icon:
            "from-slate-500 to-slate-700",
        };
    }
  };

  const totalMembers = projects.reduce(
    (total, project) =>
      total + (project.memberCount ?? 0),
    0
  );

  return (
    <section className="min-h-full bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Workspace
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Shared Projects
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Organize work, manage your team, and
              collaborate across shared projects.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreateForm(
                (current) => !current
              );
              setError("");
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 sm:w-auto"
          >
            <span className="text-lg leading-none">
              {showCreateForm ? "×" : "+"}
            </span>
            {showCreateForm
              ? "Cancel"
              : "New Project"}
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                ▣
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Projects
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {projects.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                👥
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Team Members
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {totalMembers}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                ✓
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Active Workspace
                </p>
                <p className="text-xl font-bold text-slate-800">
                  Ready
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-600">
          <span className="shrink-0">⚠</span>
          <span className="break-words">
            {error}
          </span>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-7 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/60 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                +
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Create New Project
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  You will automatically become the
                  project owner.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <label
                htmlFor="project-name"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Project Name
              </label>

              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="e.g. Website Redesign"
                maxLength={100}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <p className="mt-1.5 text-right text-xs text-slate-400">
                {name.length}/100
              </p>
            </div>

            <div>
              <label
                htmlFor="project-description"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Description
              </label>

              <textarea
                id="project-description"
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Describe the project..."
                maxLength={500}
                rows={4}
                disabled={submitting}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <p className="mt-1.5 text-right text-xs text-slate-400">
                {description.length}/500
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setName("");
                  setDescription("");
                  setError("");
                }}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateProject}
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {submitting
                  ? "Creating..."
                  : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
          </div>

          <p className="mt-4 text-sm font-bold text-slate-600">
            Loading projects...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Fetching your shared workspace
          </p>
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-2xl">
            📁
          </div>

          <h2 className="mt-5 text-lg font-bold text-slate-800">
            No projects yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Create your first project to start
            organizing work and collaborating with
            your team.
          </p>

          <button
            type="button"
            onClick={() => {
              setShowCreateForm(true);
              setError("");
            }}
            className="mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-md"
          >
            + Create Project
          </button>
        </div>
      ) : (
        /* Project Grid */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const roleStyle =
              getRoleStyle(project.role);

            return (
              <div
                key={project.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
              >
                {/* Colored Top */}
                <div
                  className={`h-1.5 bg-gradient-to-r ${roleStyle.icon}`}
                />

                <div className="p-5 sm:p-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${roleStyle.icon} text-xl text-white shadow-sm`}
                    >
                      ▣
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${roleStyle.badge}`}
                    >
                      {project.role}
                    </span>
                  </div>

                  {/* Details */}
                  <h2 className="mt-5 truncate text-lg font-bold text-slate-800">
                    {project.name}
                  </h2>

                  <p className="mt-2 min-h-[48px] break-words text-sm leading-6 text-slate-500">
                    {project.description ||
                      "No project description."}
                  </p>

                  {/* Stats */}
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Members
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        👥{" "}
                        {project.memberCount ??
                          "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Created
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-slate-700">
                        {project.createdAt &&
                        !Number.isNaN(
                          new Date(
                            project.createdAt
                          ).getTime()
                        )
                          ? new Date(
                              project.createdAt
                            ).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Open */}
                  <Link
                    href={`/projects/${project.id}`}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    Open Project
                    <span className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}