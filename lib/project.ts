import mongoose, { Schema, Model } from "mongoose";

// ==========================================
// PROJECT INTERFACE
// ==========================================

export interface IProject {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// PROJECT SCHEMA
// ==========================================

const ProjectSchema = new Schema<IProject>(
  {
    // User who created and owns the project
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Project name
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // Optional project description
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// PERFORMANCE INDEX
// ==========================================

// Speeds up project lists for a user
// ordered from newest to oldest.
ProjectSchema.index({
  ownerId: 1,
  createdAt: -1,
});

// ==========================================
// PROJECT MODEL
// ==========================================

const Project: Model<IProject> =
  mongoose.models.Project ||
  mongoose.model<IProject>(
    "Project",
    ProjectSchema
  );

export default Project;