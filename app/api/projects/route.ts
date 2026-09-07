import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Project from "@/lib/project";
import ProjectMember from "@/lib/projectMember";
import { getAuthUser } from "@/lib/auth";

// ==========================================
// GET PROJECTS
// ==========================================

export async function GET() {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(authUser.userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find projects where the current user
    // is a member.
    const memberships =
      await ProjectMember.find({
        userId: authUser.userId,
      })
        .select("projectId role")
        .lean();

    const projectIds = memberships.map(
      (membership) => membership.projectId
    );

    if (projectIds.length === 0) {
      return NextResponse.json([], {
        status: 200,
      });
    }

    const projects = await Project.find({
      _id: {
        $in: projectIds,
      },
    })
      .sort({ createdAt: -1 })
      .lean();

    // ==========================================
    // GET MEMBER COUNTS
    // ==========================================

    const memberCounts =
      await ProjectMember.aggregate([
        {
          $match: {
            projectId: {
              $in: projectIds,
            },
          },
        },
        {
          $group: {
            _id: "$projectId",
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const memberCountMap = new Map(
      memberCounts.map((item) => [
        item._id.toString(),
        item.count,
      ])
    );

    // ==========================================
    // ROLE MAP
    // ==========================================

    const roleMap = new Map(
      memberships.map((membership) => [
        membership.projectId.toString(),
        membership.role,
      ])
    );

    // ==========================================
    // FORMAT RESPONSE
    // ==========================================

    const formattedProjects = projects.map(
      (project) => {
        const projectId =
          project._id.toString();

        return {
          id: projectId,
          ownerId:
            project.ownerId.toString(),
          name: project.name,
          description: project.description,
          role:
            roleMap.get(projectId) ||
            "Member",
          memberCount:
            memberCountMap.get(projectId) ||
            0,
          createdAt:
            project.createdAt,
          updatedAt:
            project.updatedAt,
        };
      }
    );

    return NextResponse.json(
      formattedProjects,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET PROJECTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch projects",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// CREATE PROJECT
// ==========================================

export async function POST(
  request: Request
) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(authUser.userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
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

    await connectDB();

    // ==========================================
    // CREATE PROJECT
    // ==========================================

    const userId =
      new mongoose.Types.ObjectId(
        authUser.userId
      );

    const project = await Project.create({
      ownerId: userId,
      name,
      description,
    });

    // ==========================================
    // ADD OWNER AS PROJECT MEMBER
    // ==========================================

    await ProjectMember.create({
      projectId: project._id,
      userId,
      role: "Owner",
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        id: project._id.toString(),
        ownerId:
          project.ownerId.toString(),
        name: project.name,
        description:
          project.description,
        role: "Owner",
        memberCount: 1,
        createdAt:
          project.createdAt,
        updatedAt:
          project.updatedAt,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE PROJECT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to create project",
      },
      {
        status: 500,
      }
    );
  }
}