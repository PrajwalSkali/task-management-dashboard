import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Project from "@/lib/project";
import ProjectMember from "@/lib/projectMember";
import { getAuthUser } from "@/lib/auth";

// ==========================================
// CHECK PROJECT ACCESS
// ==========================================

async function getMembership(
  projectId: string,
  userId: string
) {
  return ProjectMember.findOne({
    projectId,
    userId,
  })
    .select("projectId userId role")
    .lean();
}

// ==========================================
// UPDATE MEMBER ROLE
// ==========================================

export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      id: string;
      memberId: string;
    }>;
  }
) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      id: projectId,
      memberId,
    } = await context.params;

    // ==========================================
    // VALIDATE IDS
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(
        projectId
      )
    ) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        memberId
      )
    ) {
      return NextResponse.json(
        { error: "Invalid member ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const role =
      typeof body.role === "string"
        ? body.role
        : "";

    // ==========================================
    // VALIDATE ROLE
    // ==========================================

    if (
      !["Admin", "Member"].includes(role)
    ) {
      return NextResponse.json(
        {
          error:
            "Role must be Admin or Member",
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

    const project = await Project.findById(
      projectId
    )
      .select("_id ownerId")
      .lean();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // ==========================================
    // CHECK CURRENT USER PERMISSION
    // ==========================================

    const currentMembership =
      await getMembership(
        projectId,
        authUser.userId
      );

    if (
      !currentMembership ||
      !["Owner", "Admin"].includes(
        currentMembership.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only project owners and admins can change member roles",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // FIND TARGET MEMBER
    // ==========================================

    const member =
      await ProjectMember.findOne({
        _id: memberId,
        projectId,
      });

    if (!member) {
      return NextResponse.json(
        {
          error:
            "Project member not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // PREVENT OWNER ROLE CHANGE
    // ==========================================

    if (member.role === "Owner") {
      return NextResponse.json(
        {
          error:
            "The project owner's role cannot be changed",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // ADMIN CANNOT CHANGE ANOTHER ADMIN
    // ==========================================

    if (
      currentMembership.role === "Admin" &&
      member.role === "Admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Admins cannot change another admin's role",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // UPDATE ROLE
    // ==========================================

    member.role = role;

    await member.save();

    return NextResponse.json(
      {
        id: member._id.toString(),
        userId: member.userId.toString(),
        role: member.role,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "UPDATE PROJECT MEMBER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update project member",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// REMOVE PROJECT MEMBER
// ==========================================

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      id: string;
      memberId: string;
    }>;
  }
) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      id: projectId,
      memberId,
    } = await context.params;

    // ==========================================
    // VALIDATE IDS
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(
        projectId
      )
    ) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        memberId
      )
    ) {
      return NextResponse.json(
        { error: "Invalid member ID" },
        { status: 400 }
      );
    }

    await connectDB();

    // ==========================================
    // CHECK PROJECT
    // ==========================================

    const project = await Project.findById(
      projectId
    )
      .select("_id ownerId")
      .lean();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // ==========================================
    // CHECK CURRENT USER PERMISSION
    // ==========================================

    const currentMembership =
      await getMembership(
        projectId,
        authUser.userId
      );

    if (
      !currentMembership ||
      !["Owner", "Admin"].includes(
        currentMembership.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only project owners and admins can remove members",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // FIND TARGET MEMBER
    // ==========================================

    const member =
      await ProjectMember.findOne({
        _id: memberId,
        projectId,
      });

    if (!member) {
      return NextResponse.json(
        {
          error:
            "Project member not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // PREVENT OWNER REMOVAL
    // ==========================================

    if (member.role === "Owner") {
      return NextResponse.json(
        {
          error:
            "The project owner cannot be removed",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // ADMIN PERMISSIONS
    // ==========================================

    if (
      currentMembership.role === "Admin" &&
      member.role === "Admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Admins cannot remove another admin",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // REMOVE MEMBER
    // ==========================================

    const deletedMember =
      await ProjectMember.findOneAndDelete({
        _id: memberId,
        projectId,
      });

    if (!deletedMember) {
      return NextResponse.json(
        {
          error:
            "Project member could not be removed",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        message:
          "Project member removed successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "REMOVE PROJECT MEMBER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to remove project member",
      },
      {
        status: 500,
      }
    );
  }
}