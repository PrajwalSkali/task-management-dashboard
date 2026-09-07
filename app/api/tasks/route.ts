import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Task, {
  type TaskPriority,
  type TaskStatus,
} from "@/lib/task";
import User from "@/lib/user";
import Project from "@/lib/project";
import ProjectMember from "@/lib/projectMember";
import { getAuthUser } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

// ==========================================
// CONSTANTS
// ==========================================

const VALID_STATUSES = [
  "Pending",
  "In Progress",
  "Completed",
] as const;

const VALID_PRIORITIES = [
  "Low",
  "Medium",
  "High",
] as const;

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_CATEGORY_LENGTH = 100;

// ==========================================
// HELPERS
// ==========================================

function isValidDateString(
  value: string
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isTaskStatus(
  value: unknown
): value is TaskStatus {
  return (
    typeof value === "string" &&
    VALID_STATUSES.includes(
      value as TaskStatus
    )
  );
}

function isTaskPriority(
  value: unknown
): value is TaskPriority {
  return (
    typeof value === "string" &&
    VALID_PRIORITIES.includes(
      value as TaskPriority
    )
  );
}

// ==========================================
// GET TASKS
// ==========================================

export async function GET() {
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

    // ==========================================
    // VALIDATE AUTHENTICATED USER
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(
        authUser.userId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid authenticated user",
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    const tasks = await Task.find({
      userId: authUser.userId,
    })
      .sort({
        order: 1,
        createdAt: -1,
      })
      .lean();

    // ==========================================
    // OLD TASK ORDER MIGRATION
    // ==========================================

    const needsOrderMigration =
      tasks.some(
        (task, index) =>
          task.order !== index
      );

    if (needsOrderMigration) {
      await Promise.all(
        tasks.map((task, index) =>
          Task.updateOne(
            {
              _id: task._id,
              userId:
                authUser.userId,
            },
            {
              $set: {
                order: index,
              },
            }
          )
        )
      );

      tasks.forEach(
        (task, index) => {
          task.order = index;
        }
      );
    }

    // ==========================================
    // FORMAT RESPONSE
    // ==========================================

    const formattedTasks =
      tasks.map((task) => ({
        id: task._id.toString(),

        title: task.title,

        description:
          task.description,

        dueDate: task.dueDate,

        category: task.category,

        status: task.status,

        priority: task.priority,

        order: task.order,

        projectId:
          task.projectId
            ? task.projectId.toString()
            : null,

        assignedTo:
          task.assignedTo
            ? task.assignedTo.toString()
            : null,

        createdAt:
          task.createdAt,

        updatedAt:
          task.updatedAt,
      }));

    return NextResponse.json(
      formattedTasks,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET TASKS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch tasks",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// CREATE TASK
// ==========================================

export async function POST(
  request: Request
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
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // VALIDATE AUTHENTICATED USER
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(
        authUser.userId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid authenticated user",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // DATABASE CONNECTION
    // ==========================================

    await connectDB();

    // ==========================================
    // PARSE REQUEST BODY
    // ==========================================

    let body: Record<
      string,
      unknown
    >;

    try {
      const parsed =
        await request.json();

      if (
        !parsed ||
        typeof parsed !==
          "object" ||
        Array.isArray(parsed)
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid request body",
          },
          {
            status: 400,
          }
        );
      }

      body =
        parsed as Record<
          string,
          unknown
        >;
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request body",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // READ BASIC TASK DATA
    // ==========================================

    const title =
      typeof body.title ===
      "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description ===
      "string"
        ? body.description.trim()
        : "";

    const dueDate =
      typeof body.dueDate ===
      "string"
        ? body.dueDate
        : "";

    const category =
      typeof body.category ===
      "string"
        ? body.category.trim()
        : "";

    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if (!title) {
      return NextResponse.json(
        {
          error:
            "Task title is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      title.length >
      MAX_TITLE_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `Task title cannot exceed ${MAX_TITLE_LENGTH} characters`,
        },
        {
          status: 400,
        }
      );
    }

    if (
      description.length >
      MAX_DESCRIPTION_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `Task description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`,
        },
        {
          status: 400,
        }
      );
    }

    if (!dueDate) {
      return NextResponse.json(
        {
          error:
            "Due date is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidDateString(
        dueDate
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid due date",
        },
        {
          status: 400,
        }
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          error:
            "Category is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      category.length >
      MAX_CATEGORY_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `Category cannot exceed ${MAX_CATEGORY_LENGTH} characters`,
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // STATUS VALIDATION
    // ==========================================

    if (
      !isTaskStatus(
        body.status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid task status",
        },
        {
          status: 400,
        }
      );
    }

    const status: TaskStatus =
      body.status;

    // ==========================================
    // PRIORITY VALIDATION
    // ==========================================

    if (
      !isTaskPriority(
        body.priority
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid task priority",
        },
        {
          status: 400,
        }
      );
    }

    const priority: TaskPriority =
      body.priority;

    // ==========================================
    // VALIDATE PROJECT
    // ==========================================

    let projectId:
      | mongoose.Types.ObjectId
      | undefined;

    if (
      body.projectId !==
        undefined &&
      body.projectId !==
        null &&
      body.projectId !== ""
    ) {
      if (
        typeof body.projectId !==
          "string" ||
        !mongoose.Types.ObjectId.isValid(
          body.projectId
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid project",
          },
          {
            status: 400,
          }
        );
      }

      const project =
        await Project.findById(
          body.projectId
        )
          .select("_id")
          .lean();

      if (!project) {
        return NextResponse.json(
          {
            error:
              "Project not found",
          },
          {
            status: 404,
          }
        );
      }

      // ==========================================
      // PROJECT MEMBERSHIP
      // ==========================================

      const membership =
        await ProjectMember.findOne(
          {
            projectId:
              body.projectId,

            userId:
              authUser.userId,
          }
        )
          .select("_id")
          .lean();

      if (!membership) {
        return NextResponse.json(
          {
            error:
              "You are not a member of this project",
          },
          {
            status: 403,
          }
        );
      }

      projectId =
        new mongoose.Types.ObjectId(
          body.projectId
        );
    }

    // ==========================================
    // VALIDATE ASSIGNMENT
    // ==========================================

    let assignedTo:
      | mongoose.Types.ObjectId
      | undefined;

    if (
      body.assignedTo !==
        undefined &&
      body.assignedTo !==
        null &&
      body.assignedTo !== ""
    ) {
      if (
        typeof body.assignedTo !==
          "string" ||
        !mongoose.Types.ObjectId.isValid(
          body.assignedTo
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid assignee",
          },
          {
            status: 400,
          }
        );
      }

      // ==========================================
      // PERSONAL TASK ASSIGNMENT
      // ==========================================

      if (
        !projectId &&
        body.assignedTo !==
          authUser.userId
      ) {
        return NextResponse.json(
          {
            error:
              "Personal tasks can only be assigned to yourself",
          },
          {
            status: 400,
          }
        );
      }

      // ==========================================
      // CHECK USER EXISTS
      // ==========================================

      const assignedUser =
        await User.findById(
          body.assignedTo
        )
          .select("_id")
          .lean();

      if (!assignedUser) {
        return NextResponse.json(
          {
            error:
              "Assigned user not found",
          },
          {
            status: 400,
          }
        );
      }

      // ==========================================
      // CHECK PROJECT MEMBERSHIP
      // ==========================================

      if (projectId) {
        const assigneeMembership =
          await ProjectMember.findOne(
            {
              projectId,

              userId:
                body.assignedTo,
            }
          )
            .select("_id")
            .lean();

        if (
          !assigneeMembership
        ) {
          return NextResponse.json(
            {
              error:
                "The assignee must be a member of the project",
            },
            {
              status: 400,
            }
          );
        }
      }

      assignedTo =
        new mongoose.Types.ObjectId(
          body.assignedTo
        );
    }

    // ==========================================
    // FIND NEXT TASK ORDER
    // ==========================================

    const lastTask =
      await Task.findOne({
        userId:
          authUser.userId,
      })
        .sort({
          order: -1,
        })
        .select("order")
        .lean();

    const nextOrder =
      lastTask &&
      typeof lastTask.order ===
        "number"
        ? lastTask.order + 1
        : 0;

    // ==========================================
    // CREATE TASK
    // ==========================================

    const task =
      await Task.create({
        userId:
          authUser.userId,

        projectId,

        assignedTo,

        title,

        description,

        dueDate,

        category,

        status,

        priority,

        order:
          nextOrder,
      });

    // ==========================================
    // ACTIVITY LOG
    // ==========================================

    await logActivity({
      userId:
        authUser.userId,

      taskId:
        task._id,

      action:
        "Task Created",

      description:
        `Created task "${task.title}"`,
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        id:
          task._id.toString(),

        title:
          task.title,

        description:
          task.description,

        dueDate:
          task.dueDate,

        category:
          task.category,

        status:
          task.status,

        priority:
          task.priority,

        order:
          task.order,

        projectId:
          task.projectId
            ? task.projectId.toString()
            : null,

        assignedTo:
          task.assignedTo
            ? task.assignedTo.toString()
            : null,

        createdAt:
          task.createdAt,

        updatedAt:
          task.updatedAt,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE TASK ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create task",
      },
      {
        status: 500,
      }
    );
  }
}