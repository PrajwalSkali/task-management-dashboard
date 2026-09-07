import mongoose, { Schema, Model } from "mongoose";

// ==========================================
// COMMENT INTERFACE
// ==========================================

export interface IComment {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// COMMENT SCHEMA
// ==========================================

const CommentSchema = new Schema<IComment>(
  {
    // Task the comment belongs to
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },

    // User who created the comment
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Comment text
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// INDEXES
// ==========================================

// Speeds up loading comments for a task
// in chronological order.
CommentSchema.index({
  taskId: 1,
  createdAt: 1,
});

// Speeds up user-specific comment queries
// if needed in the future.
CommentSchema.index({
  userId: 1,
  createdAt: -1,
});

// ==========================================
// COMMENT MODEL
// ==========================================

const Comment: Model<IComment> =
  mongoose.models.Comment ||
  mongoose.model<IComment>(
    "Comment",
    CommentSchema
  );

export default Comment;