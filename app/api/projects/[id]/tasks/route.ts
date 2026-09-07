import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Task from "@/lib/task";
import User from "@/lib/user";
import Project from "@/lib/project";
import ProjectMember from "@/lib/projectMember";
import { getAuthUser } from "@/lib/auth";

// ==========================================
// GET PROJECT TASKS
// ==========================================

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ==========================================
    // VALIDATE AUTHENTICATED USER ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(
        authUser.userId
      )
    ) {
      return NextResponse.json(
        { error: "Invalid authenticated user" },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;

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
      .select("_id name")
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
        { status: 403 }
      );
    }

    // ==========================================
    // GET PROJECT TASKS
    // ==========================================

    const tasks = await Task.find({
      projectId,
    })
      .sort({
        order: 1,
        createdAt: -1,
      })
      .lean();

    // ==========================================
    // GET ASSIGNED USERS
    // ==========================================

    const assignedUserIds = [
      ...new Set(
        tasks
          .filter((task) => task.assignedTo)
          .map((task) =>
            task.assignedTo!.toString()
          )
          .filter((id) =>
            mongoose.Types.ObjectId.isValid(id)
          )
      ),
    ];

    const assignedUsers =
      assignedUserIds.length > 0
        ? await User.find({
            _id: {
              $in: assignedUserIds,
            },
          })
            .select("_id name email")
            .lean()
        : [];

    // ==========================================
    // CREATE USER MAP
    // ==========================================

    const userMap = new Map(
      assignedUsers.map((user) => [
        user._id.toString(),
        {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      ])
    );

    // ==========================================
    // FORMAT RESPONSE
    // ==========================================

    const formattedTasks = tasks.map(
      (task) => {
        const isTaskOwner =
          task.userId.toString() ===
          authUser.userId.toString();

        return {
          id: task._id.toString(),

          userId: task.userId.toString(),

          projectId: task.projectId
            ? task.projectId.toString()
            : null,

          title: task.title,

          description: task.description,

          dueDate: task.dueDate,

          category: task.category,

          status: task.status,

          priority: task.priority,

          order: task.order,

          assignedTo: task.assignedTo
            ? task.assignedTo.toString()
            : null,

          assignedUser: task.assignedTo
            ? userMap.get(
                task.assignedTo.toString()
              ) || null
            : null,

          // ========================================
          // TASK PERMISSIONS
          // ========================================

          canEdit: isTaskOwner,

          canDelete: isTaskOwner,

          createdAt: task.createdAt,

          updatedAt: task.updatedAt,
        };
      }
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        project: {
          id: project._id.toString(),
          name: project.name,
        },

        tasks: formattedTasks,

        memberRole: membership.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET PROJECT TASKS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch project tasks",
      },
      { status: 500 }
    );
  }
}