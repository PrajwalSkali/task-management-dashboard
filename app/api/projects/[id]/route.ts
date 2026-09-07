import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Project from "@/lib/project";
import ProjectMember from "@/lib/projectMember";
import Activity from "@/lib/activity";
import { getAuthUser } from "@/lib/auth";

// ==========================================
// GET PROJECT
// ==========================================

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id: projectId } =
      await context.params;

    // ==========================================
    // VALIDATE PROJECT ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(
        projectId
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid project ID",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    // ==========================================
    // CHECK MEMBERSHIP
    // ==========================================

    const membership =
      await ProjectMember.findOne({
        projectId,
        userId: authUser.userId,
      })
        .select("role")
        .lean();

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "You do not have access to this project",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // GET PROJECT
    // ==========================================

    const project =
      await Project.findById(
        projectId
      ).lean();

    if (!project) {
      return NextResponse.json(
        {
          error: "Project not found",
        },
        {
          status: 404,
        }
      );
    }

    const memberCount =
      await ProjectMember.countDocuments({
        projectId,
      });

    return NextResponse.json(
      {
        id: project._id.toString(),

        ownerId:
          project.ownerId.toString(),

        name: project.name,

        description:
          project.description,

        role: membership.role,

        memberCount,

        createdAt:
          project.createdAt,

        updatedAt:
          project.updatedAt,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET PROJECT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch project",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// UPDATE PROJECT
// ==========================================

export async function PUT(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const authUser =
      await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id: projectId } =
      await context.params;

    // ==========================================
    // VALIDATE PROJECT ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(
        projectId
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid project ID",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // READ REQUEST BODY
    // ==========================================

    const body =
      await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description ===
      "string"
        ? body.description.trim()
        : "";

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Project name is required",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          error:
            "Project name cannot exceed 100 characters",
        },
        {
          status: 400,
        }
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        {
          error:
            "Project description cannot exceed 500 characters",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // DATABASE
    // ==========================================

    await connectDB();

    // ==========================================
    // CHECK PROJECT
    // ==========================================

    const project =
      await Project.findById(
        projectId
      );

    if (!project) {
      return NextResponse.json(
        {
          error: "Project not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // CHECK PERMISSION
    // ==========================================

    const membership =
      await ProjectMember.findOne({
        projectId,
        userId: authUser.userId,
      })
        .select("role")
        .lean();

    if (
      !membership ||
      !["Owner", "Admin"].includes(
        membership.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only project owners and admins can update the project",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // SAVE OLD VALUES
    // ==========================================

    const oldName =
      project.name;

    const oldDescription =
      project.description || "";

    const nameChanged =
      oldName !== name;

    const descriptionChanged =
      oldDescription !== description;

    // ==========================================
    // UPDATE PROJECT
    // ==========================================

    project.name = name;
    project.description =
      description;

    await project.save();

    // ==========================================
    // ACTIVITY: PROJECT UPDATED
    // ==========================================

    if (
      nameChanged ||
      descriptionChanged
    ) {
      let activityDescription =
        "";

      // ----------------------------------------
      // NAME + DESCRIPTION CHANGED
      // ----------------------------------------

      if (
        nameChanged &&
        descriptionChanged
      ) {
        activityDescription =
          `Updated project name from "${oldName}" to "${name}" and updated the project description`;
      }

      // ----------------------------------------
      // NAME ONLY CHANGED
      // ----------------------------------------

      else if (nameChanged) {
        activityDescription =
          `Changed project name from "${oldName}" to "${name}"`;
      }

      // ----------------------------------------
      // DESCRIPTION ONLY CHANGED
      // ----------------------------------------

      else {
        activityDescription =
          "Updated project description";
      }

      await Activity.create({
        userId:
          new mongoose.Types.ObjectId(
            authUser.userId
          ),

        projectId:
          project._id,

        action:
          "Project Updated",

        description:
          activityDescription,
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        id:
          project._id.toString(),

        ownerId:
          project.ownerId.toString(),

        name:
          project.name,

        description:
          project.description,

        role:
          membership.role,

        memberCount:
          await ProjectMember.countDocuments(
            {
              projectId,
            }
          ),

        createdAt:
          project.createdAt,

        updatedAt:
          project.updatedAt,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "UPDATE PROJECT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update project",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// DELETE PROJECT
// ==========================================

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const authUser =
      await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id: projectId } =
      await context.params;

    // ==========================================
    // VALIDATE PROJECT ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(
        projectId
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid project ID",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    // ==========================================
    // CHECK PROJECT
    // ==========================================

    const project =
      await Project.findById(
        projectId
      );

    if (!project) {
      return NextResponse.json(
        {
          error: "Project not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // CHECK OWNER PERMISSION
    // ==========================================

    const membership =
      await ProjectMember.findOne({
        projectId,
        userId: authUser.userId,
      })
        .select("role")
        .lean();

    if (
      !membership ||
      membership.role !== "Owner"
    ) {
      return NextResponse.json(
        {
          error:
            "Only the project owner can delete the project",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // SAVE PROJECT NAME
    // ==========================================

    const projectName =
      project.name;

    // ==========================================
    // DELETE PROJECT MEMBERS
    // ==========================================

    await ProjectMember.deleteMany({
      projectId,
    });

    // ==========================================
    // DELETE PROJECT
    // ==========================================

    const deletedProject =
      await Project.findOneAndDelete({
        _id: projectId,
        ownerId: authUser.userId,
      });

    if (!deletedProject) {
      return NextResponse.json(
        {
          error:
            "Project could not be deleted",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // ACTIVITY: PROJECT DELETED
    // ==========================================

    await Activity.create({
      userId:
        new mongoose.Types.ObjectId(
          authUser.userId
        ),

      projectId:
        deletedProject._id,

      action:
        "Project Deleted",

      description:
        `Deleted project "${projectName}"`,
    });

    return NextResponse.json(
      {
        message:
          "Project deleted successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "DELETE PROJECT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete project",
      },
      {
        status: 500,
      }
    );
  }
}