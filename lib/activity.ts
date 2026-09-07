import mongoose, { Schema, Model } from "mongoose";

// ==========================================
// ACTIVITY TYPES
// ==========================================

export type ActivityAction =
  | "Task Created"
  | "Task Updated"
  | "Task Deleted"
  | "Task Assigned"
  | "Task Unassigned"
  | "Status Changed"
  | "Priority Changed"
  | "Comment Added"
  | "Comment Updated"
  | "Comment Deleted"
  | "Project Created"
  | "Project Updated"
  | "Project Deleted";

// ==========================================
// ACTIVITY INTERFACE
// ==========================================

export interface IActivity {
  userId: mongoose.Types.ObjectId;

  // Optional task related to the activity
  taskId?: mongoose.Types.ObjectId;

  // Optional project related to the activity
  projectId?: mongoose.Types.ObjectId;

  action: ActivityAction;
  description: string;

  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// ACTIVITY SCHEMA
// ==========================================

const ActivitySchema = new Schema<IActivity>(
  {
    // ========================================
    // USER WHO PERFORMED THE ACTION
    // ========================================

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // TASK RELATED TO THE ACTIVITY
    // ========================================

    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: undefined,
      index: true,
    },

    // ========================================
    // PROJECT RELATED TO THE ACTIVITY
    // ========================================

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: undefined,
      index: true,
    },

    // ========================================
    // TYPE OF ACTION
    // ========================================

    action: {
      type: String,
      enum: [
        "Task Created",
        "Task Updated",
        "Task Deleted",
        "Task Assigned",
        "Task Unassigned",
        "Status Changed",
        "Priority Changed",
        "Comment Added",
        "Comment Updated",
        "Comment Deleted",
        "Project Created",
        "Project Updated",
        "Project Deleted",
      ],
      required: true,
    },

    // ========================================
    // HUMAN-READABLE DESCRIPTION
    // ========================================

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// INDEXES
// ==========================================

// Task activity history
ActivitySchema.index({
  taskId: 1,
  createdAt: -1,
});

// Project activity history
ActivitySchema.index({
  projectId: 1,
  createdAt: -1,
});

// User activity history
ActivitySchema.index({
  userId: 1,
  createdAt: -1,
});

// ==========================================
// ACTIVITY MODEL
// ==========================================

const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>(
    "Activity",
    ActivitySchema
  );

export default Activity;