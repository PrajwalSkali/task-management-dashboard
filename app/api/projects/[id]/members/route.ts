import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Project from "@/lib/project";
import ProjectMember from "@/lib/projectMember";
import User from "@/lib/user";
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
// GET PROJECT MEMBERS
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
        { error: "Unauthorized" },
        { status: 401 }
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
        { error: "Invalid project ID" },
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
      .select("_id")
      .lean();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // ==========================================
    // CHECK PROJECT MEMBERSHIP
    // ==========================================

    const membership =
      await getMembership(
        projectId,
        authUser.userId
      );

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "You do not have access to this project",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // GET MEMBERS
    // ==========================================

    const members =
      await ProjectMember.find({
        projectId,
      })
        .sort({ createdAt: 1 })
        .lean();

    const userIds = members.map(
      (member) => member.userId
    );

    const users =
      userIds.length > 0
        ? await User.find({
            _id: {
              $in: userIds,
            },
          })
            .select("_id name email")
            .lean()
        : [];

    // ==========================================
    // CREATE USER MAP
    // ==========================================

    const userMap = new Map(
      users.map((user) => [
        user._id.toString(),
        {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      ])
    );

    // ==========================================
    // FORMAT MEMBERS
    // ==========================================

    const formattedMembers =
      members.map((member) => {
        const user = userMap.get(
          member.userId.toString()
        );

        return {
          id: member._id.toString(),
          userId: member.userId.toString(),

          // FIX:
          // Return name and email directly
          // because the frontend expects
          // member.name and member.email.
          name: user?.name || "Unknown User",
          email: user?.email || "",

          role: member.role,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
        };
      });

    return NextResponse.json(
      formattedMembers,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET PROJECT MEMBERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch project members",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// ADD PROJECT MEMBER
// ==========================================

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
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
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const userId =
      typeof body.userId === "string"
        ? body.userId.trim()
        : "";

    const role =
      typeof body.role === "string"
        ? body.role
        : "Member";

    // ==========================================
    // VALIDATE USER ID
    // ==========================================

    if (!userId) {
      return NextResponse.json(
        {
          error: "User ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid user ID",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // VALIDATE ROLE
    // ==========================================

    if (
      !["Admin", "Member"].includes(role)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid project member role",
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
      .select("_id")
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

    const membership =
      await getMembership(
        projectId,
        authUser.userId
      );

    if (
      !membership ||
      !["Owner", "Admin"].includes(
        membership.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only project owners and admins can add members",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // CHECK USER
    // ==========================================

    const user = await User.findById(
      userId
    )
      .select("_id name email")
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // PREVENT DUPLICATE MEMBER
    // ==========================================

    const existingMember =
      await ProjectMember.findOne({
        projectId,
        userId,
      })
        .select("_id")
        .lean();

    if (existingMember) {
      return NextResponse.json(
        {
          error:
            "User is already a project member",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================
    // ADD MEMBER
    // ==========================================

    let member;

    try {
      member =
        await ProjectMember.create({
          projectId,
          userId,
          role,
        });
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code ===
          11000
      ) {
        return NextResponse.json(
          {
            error:
              "User is already a project member",
          },
          {
            status: 409,
          }
        );
      }

      throw error;
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        id: member._id.toString(),
        userId: user._id.toString(),

        // Keep the response structure
        // consistent with GET.
        name: user.name,
        email: user.email,

        role: member.role,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "ADD PROJECT MEMBER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to add project member",
      },
      {
        status: 500,
      }
    );
  }
}