"use client";

import { useState } from "react";

import type {
  TaskPriority,
  TaskStatus,
} from "@/context/TaskContext";

import TaskComments from "@/components/TaskComments";

export interface TaskCardProps {
  id: string;
  title: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string | null;
  assignedUserName?: string | null;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function TaskCard({
  id,
  title,
  dueDate,
  status,
  priority,
  assignedTo,
  assignedUserName,
  onDelete,
  onEdit,
}: TaskCardProps) {
  const [showComments, setShowComments] =
    useState(false);

  const statusStyles: Record<TaskStatus, string> = {
    Pending:
      "border-red-200 bg-red-50 text-red-700",
    "In Progress":
      "border-amber-200 bg-amber-50 text-amber-700",
    Completed:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  const priorityStyles: Record<TaskPriority, string> = {
    Low:
      "border-slate-200 bg-slate-50 text-slate-600",
    Medium:
      "border-amber-200 bg-amber-50 text-amber-700",
    High:
      "border-red-200 bg-red-50 text-red-700",
  };

  // ==========================================
  // OVERDUE DETECTION
  // ==========================================

  const dueDateTime =
    new Date(dueDate).getTime();

  const currentTime =
    new Date().getTime();

  const isOverdue =
    status !== "Completed" &&
    !Number.isNaN(dueDateTime) &&
    dueDateTime < currentTime;

  return (
    <div
      className={`min-w-0 max-w-full overflow-hidden border-b last:border-b-0 ${
        isOverdue
          ? "bg-gradient-to-r from-red-50/70 via-white to-white"
          : "bg-white"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-4 p-4 transition hover:bg-slate-50/70 sm:p-5 md:flex-row md:items-center md:justify-between">

        {/* ======================================
            TASK INFORMATION
        ====================================== */}

        <div className="min-w-0 flex-1">

          {/* Title */}

          <div className="flex min-w-0 flex-wrap items-start gap-2">

            <div
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                isOverdue
                  ? "bg-red-500"
                  : status === "Completed"
                    ? "bg-emerald-500"
                    : status === "In Progress"
                      ? "bg-amber-500"
                      : "bg-blue-500"
              }`}
            />

            <h4 className="min-w-0 max-w-full break-words text-sm font-bold leading-6 text-slate-800 sm:text-base">
              {title}
            </h4>

            {/* Overdue Badge */}

            {isOverdue && (
              <span className="shrink-0 rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">
                ⚠ Overdue
              </span>
            )}

          </div>

          {/* Due Date */}

          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">

            <span
              className={`text-xs font-medium ${
                isOverdue
                  ? "text-red-600"
                  : "text-slate-500"
              }`}
            >
              Due: {dueDate}
            </span>

            {!isOverdue &&
              status === "Completed" && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  Finished
                </span>
              )}

          </div>

          {/* Overdue Message */}

          {isOverdue && (
            <div className="mt-2 flex min-w-0 items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
              <span className="shrink-0 text-xs text-red-500">
                ⚠
              </span>

              <p className="min-w-0 break-words text-xs font-medium leading-5 text-red-600">
                This task is past its deadline.
              </p>
            </div>
          )}

          {/* ======================================
              ASSIGNED TEAM MEMBER
          ====================================== */}

          {assignedTo && (
            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">

              <span className="shrink-0 text-xs font-medium text-slate-400">
                Assigned to
              </span>

              <span className="flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">

                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {(assignedUserName ||
                    "T"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <span className="max-w-[220px] break-words">
                  {assignedUserName ||
                    "Team member"}
                </span>

              </span>
            </div>
          )}

          {!assignedTo && (
            <p className="mt-3 text-xs font-medium text-slate-400">
              Unassigned
            </p>
          )}

        </div>

        {/* ======================================
            STATUS, PRIORITY AND ACTIONS
        ====================================== */}

        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 md:shrink-0 md:justify-end">

          {/* Priority */}

          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${
              priorityStyles[priority]
            }`}
          >
            {priority}
          </span>

          {/* Status */}

          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${
              statusStyles[status]
            }`}
          >
            {status}
          </span>

          {/* Comments */}

          <button
            type="button"
            onClick={() =>
              setShowComments(
                (current) => !current
              )
            }
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              showComments
                ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            }`}
          >
            <span>
              💬
            </span>

            <span>
              Comments
            </span>
          </button>

          {/* Edit */}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(id)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 hover:shadow-sm"
            >
              <span>
                ✎
              </span>

              <span>
                Edit
              </span>
            </button>
          )}

          {/* Delete */}

          <button
            type="button"
            onClick={() => onDelete(id)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:shadow-sm"
          >
            <span>
              🗑
            </span>

            <span>
              Delete
            </span>
          </button>

        </div>
      </div>

      {/* ======================================
          COMMENTS
      ====================================== */}

      {showComments && (
        <div className="min-w-0 max-w-full border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-5 sm:py-5">
          <TaskComments taskId={id} />
        </div>
      )}
    </div>
  );
}