"use client";

import type {
  TaskPriority,
  TaskStatus,
} from "@/context/TaskContext";

export interface TaskCardProps {
  id: number;
  title: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  onDelete: (id: number) => void;
  onEdit?: (id: number) => void;
}

export default function TaskCard({
  id,
  title,
  dueDate,
  status,
  priority,
  onDelete,
  onEdit,
}: TaskCardProps) {
  const statusStyles: Record<TaskStatus, string> = {
    Pending: "bg-red-100 text-red-700",
    "In Progress": "bg-yellow-100 text-yellow-700",
    Completed: "bg-green-100 text-green-700",
  };

  const priorityStyles: Record<TaskPriority, string> = {
    Low: "bg-gray-100 text-gray-700",
    Medium: "bg-yellow-100 text-yellow-700",
    High: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex items-center justify-between border-b p-5 last:border-b-0">
      
      {/* Task Information */}
      <div>
        <h4 className="font-medium text-gray-900">
          {title}
        </h4>

        <p className="mt-1 text-sm text-gray-500">
          Due: {dueDate}
        </p>
      </div>

      {/* Status, Priority and Actions */}
      <div className="flex items-center gap-3">

        {/* Priority */}
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${priorityStyles[priority]}`}
        >
          {priority}
        </span>

        {/* Status */}
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[status]}`}
        >
          {status}
        </span>

        {/* Edit */}
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(id)}
            className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            Edit
          </button>
        )}

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Delete
        </button>

      </div>
    </div>
  );
}