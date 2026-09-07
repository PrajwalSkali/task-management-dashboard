import mongoose, { Schema, Model } from "mongoose";

// ==========================================
// PROJECT MEMBER ROLES
// ==========================================

export type ProjectMemberRole =
  | "Owner"
  | "Admin"
  | "Member";

// ==========================================
// PROJECT MEMBER INTERFACE
// ==========================================

export interface IProjectMember {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: ProjectMemberRole;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// PROJECT MEMBER SCHEMA
// ==========================================

const ProjectMemberSchema =
  new Schema<IProjectMember>(
    {
      // Project the user belongs to
      projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true,
      },

      // User who is a member
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      // Permission level
      role: {
        type: String,
        enum: [
          "Owner",
          "Admin",
          "Member",
        ],
        default: "Member",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

// ==========================================
// PREVENT DUPLICATE MEMBERS
// ==========================================

ProjectMemberSchema.index(
  {
    projectId: 1,
    userId: 1,
  },
  {
    unique: true,
  }
);

// ==========================================
// PROJECT MEMBER MODEL
// ==========================================

const ProjectMember: Model<IProjectMember> =
  mongoose.models.ProjectMember ||
  mongoose.model<IProjectMember>(
    "ProjectMember",
    ProjectMemberSchema
  );

export default ProjectMember;