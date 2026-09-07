import mongoose, { Schema, Model } from "mongoose";

// ==========================================
// TASK TYPES
// ==========================================

export type TaskStatus =
  | "Pending"
  | "In Progress"
  | "Completed";

export type TaskPriority =
  | "Low"
  | "Medium"
  | "High";

// ==========================================
// TASK INTERFACE
// ==========================================

export interface ITask {
  userId: mongoose.Types.ObjectId;

  // Project this task belongs to
  projectId?: mongoose.Types.ObjectId;

  // User assigned to the task
  assignedTo?: mongoose.Types.ObjectId;

  title: string;
  description: string;
  dueDate: string;
  category: string;
  status: TaskStatus;
  priority: TaskPriority;

  // Used for drag-and-drop task ordering
  order: number;

  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// TASK SCHEMA
// ==========================================

const TaskSchema = new Schema<ITask>(
  {
    // ==========================================
    // TASK OWNER
    // ==========================================

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================
    // PROJECT
    // ==========================================

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: undefined,
      index: true,
    },

    // ==========================================
    // ASSIGNED TEAM MEMBER
    // ==========================================

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },

    // ==========================================
    // TASK DETAILS
    // ==========================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    dueDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // ==========================================
    // TASK STATUS
    // ==========================================

    status: {
      type: String,
      enum: [
        "Pending",
        "In Progress",
        "Completed",
      ],
      default: "Pending",
      index: true,
    },

    // ==========================================
    // TASK PRIORITY
    // ==========================================

    priority: {
      type: String,
      enum: [
        "Low",
        "Medium",
        "High",
      ],
      default: "Medium",
      index: true,
    },

    // ==========================================
    // DRAG-AND-DROP ORDER
    // ==========================================

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// PERFORMANCE INDEXES
// ==========================================

// Project task lists are loaded in order.
TaskSchema.index({
  projectId: 1,
  order: 1,
  createdAt: -1,
});

// Team page: tasks assigned to a user.
TaskSchema.index({
  assignedTo: 1,
  order: 1,
  createdAt: -1,
});

// Personal dashboard/task list.
TaskSchema.index({
  userId: 1,
  order: 1,
  createdAt: -1,
});

// Useful for deadline and status-based queries.
TaskSchema.index({
  userId: 1,
  status: 1,
  dueDate: 1,
});

// Useful for project status filtering.
TaskSchema.index({
  projectId: 1,
  status: 1,
});

// Useful for project priority filtering.
TaskSchema.index({
  projectId: 1,
  priority: 1,
});

// ==========================================
// TASK MODEL
// ==========================================

const Task: Model<ITask> =
  mongoose.models.Task ||
  mongoose.model<ITask>(
    "Task",
    TaskSchema
  );

export default Task;