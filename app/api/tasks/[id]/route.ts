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
// TYPE HELPERS
// ==========================================

function isTaskStatus(
  value: unknown
): value is TaskStatus {
  return (
    value === "Pending" ||
    value === "In Progress" ||
    value === "Completed"
  );
}

function isTaskPriority(
  value: unknown
): value is TaskPriority {
  return (
    value === "Low" ||
    value === "Medium" ||
    value === "High"
  );
}

// ==========================================
// TYPES
// ==========================================

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ==========================================
// HELPERS
// ==========================================

// Timezone-safe YYYY-MM-DD validation.
//
// IMPORTANT:
// Do not use:
// new Date(`${value}T00:00:00`).toISOString()
//
// That can shift the date in timezones such as IST.
//
// Instead, validate the year/month/day using UTC.
function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] =
    value.split("-").map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// ==========================================
// GET SINGLE TASK
// ==========================================

export async function GET(
  request: Request,
  context: RouteContext
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

    const { id } = await context.params;

    // Validate MongoDB task ID.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: "Invalid task ID",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const task = await Task.findOne({
      _id: id,
      userId: authUser.userId,
    }).lean();

    if (!task) {
      return NextResponse.json(
        {
          error: "Task not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        id: task._id.toString(),

        title: task.title,

        description: task.description,

        dueDate: task.dueDate,

        category: task.category,

        status: task.status,

        priority: task.priority,

        order: task.order,

        projectId: task.projectId
          ? task.projectId.toString()
          : null,

        assignedTo: task.assignedTo
          ? task.assignedTo.toString()
          : null,

        createdAt: task.createdAt,

        updatedAt: task.updatedAt,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET TASK ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch task",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// UPDATE TASK
// ==========================================

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    // ==========================================
    // AUTHENTICATION
    // ==========================================

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
    // TASK ID
    // ==========================================

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: "Invalid task ID",
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
    // REQUEST BODY
    // ==========================================

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          error: "Invalid request body",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // FIND EXISTING TASK
    // ==========================================

    const existingTask =
      await Task.findById(id);

    if (!existingTask) {
      return NextResponse.json(
        {
          error: "Task not found",
        },
        {
          status: 404,
        }
      );
    }

    const isTaskOwner =
      existingTask.userId.toString() ===
      authUser.userId;

    // ==========================================
    // PROJECT ORDER-ONLY UPDATE
    // ==========================================
    //
    // The project page sends the complete task
    // object together with the new order.
    //
    // Allow project members to change ONLY order
    // when every other supplied value is unchanged.
    //

    const requestedProjectId =
      typeof body.projectId === "string"
        ? body.projectId
        : body.projectId === null
          ? null
          : undefined;

    const requestedAssignedTo =
      typeof body.assignedTo === "string"
        ? body.assignedTo
        : body.assignedTo === null ||
            body.assignedTo === ""
          ? null
          : undefined;

    const existingProjectId =
      existingTask.projectId
        ? existingTask.projectId.toString()
        : null;

    const existingAssignedTo =
      existingTask.assignedTo
        ? existingTask.assignedTo.toString()
        : null;

    const isOrderOnlyRequest =
      body.order !== undefined &&
      typeof body.order === "number" &&
      Number.isInteger(body.order) &&
      body.order >= 0 &&
      (body.title === undefined ||
        body.title === existingTask.title) &&
      (body.description === undefined ||
        body.description ===
          existingTask.description) &&
      (body.dueDate === undefined ||
        body.dueDate === existingTask.dueDate) &&
      (body.category === undefined ||
        body.category === existingTask.category) &&
      (body.status === undefined ||
        body.status === existingTask.status) &&
      (body.priority === undefined ||
        body.priority === existingTask.priority) &&
      (requestedProjectId === undefined ||
        requestedProjectId ===
          existingProjectId) &&
      (requestedAssignedTo === undefined ||
        requestedAssignedTo ===
          existingAssignedTo);

    if (isOrderOnlyRequest) {
      if (!existingTask.projectId) {
        return NextResponse.json(
          {
            error:
              "Task is not part of a project",
          },
          {
            status: 400,
          }
        );
      }

      const membership =
        await ProjectMember.findOne({
          projectId:
            existingTask.projectId,
          userId:
            authUser.userId,
        })
          .select("_id")
          .lean();

      if (!isTaskOwner && !membership) {
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

      existingTask.order =
        body.order as number;

      await existingTask.save();

      return NextResponse.json(
        {
          id: existingTask._id.toString(),

          title:
            existingTask.title,

          description:
            existingTask.description,

          dueDate:
            existingTask.dueDate,

          category:
            existingTask.category,

          status:
            existingTask.status,

          priority:
            existingTask.priority,

          order:
            existingTask.order,

          projectId:
            existingTask.projectId
              ? existingTask.projectId.toString()
              : null,

          assignedTo:
            existingTask.assignedTo
              ? existingTask.assignedTo.toString()
              : null,

          createdAt:
            existingTask.createdAt,

          updatedAt:
            existingTask.updatedAt,
        },
        {
          status: 200,
        }
      );
    }

    // ==========================================
    // PROJECT MEMBER ORDER UPDATE
    // ==========================================
    //
    // Non-owner project members are allowed to
    // reorder project tasks but cannot edit
    // task content.
    //

    if (!isTaskOwner) {
      if (!existingTask.projectId) {
        return NextResponse.json(
          {
            error: "Task not found",
          },
          {
            status: 404,
          }
        );
      }

      const membership =
        await ProjectMember.findOne({
          projectId:
            existingTask.projectId,
          userId:
            authUser.userId,
        })
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

      const requestedOrder =
        body.order;

      if (
        typeof requestedOrder !==
          "number" ||
        !Number.isInteger(
          requestedOrder
        ) ||
        requestedOrder < 0
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid task order",
          },
          {
            status: 400,
          }
        );
      }

      const requestedProject =
        typeof body.projectId ===
        "string"
          ? body.projectId
          : body.projectId === null
            ? null
            : undefined;

      if (
        requestedProject !==
        existingTask.projectId.toString()
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid project task",
          },
          {
            status: 403,
          }
        );
      }

      existingTask.order =
        requestedOrder;

      await existingTask.save();

      return NextResponse.json(
        {
          id: existingTask._id.toString(),

          title:
            existingTask.title,

          description:
            existingTask.description,

          dueDate:
            existingTask.dueDate,

          category:
            existingTask.category,

          status:
            existingTask.status,

          priority:
            existingTask.priority,

          order:
            existingTask.order,

          projectId:
            existingTask.projectId
              ? existingTask.projectId.toString()
              : null,

          assignedTo:
            existingTask.assignedTo
              ? existingTask.assignedTo.toString()
              : null,

          createdAt:
            existingTask.createdAt,

          updatedAt:
            existingTask.updatedAt,
        },
        {
          status: 200,
        }
      );
    }

    // ==========================================
    // CAPTURE PREVIOUS VALUES
    // ==========================================

    const previousTitle =
      existingTask.title;

    const previousDescription =
      existingTask.description;

    const previousDueDate =
      existingTask.dueDate;

    const previousCategory =
      existingTask.category;

    const previousStatus =
      existingTask.status;

    const previousPriority =
      existingTask.priority;

    const previousAssignedTo =
      existingTask.assignedTo
        ? existingTask.assignedTo.toString()
        : null;

    const previousProjectId =
      existingTask.projectId
        ? existingTask.projectId.toString()
        : null;

    const previousOrder =
      existingTask.order;

    // ==========================================
    // READ VALUES
    // ==========================================

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const dueDate =
      typeof body.dueDate === "string"
        ? body.dueDate.trim()
        : "";

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : "";

    // ==========================================
    // STATUS
    // ==========================================

    if (!isTaskStatus(body.status)) {
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
    // PRIORITY
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

    // ==========================================
    // DUE DATE VALIDATION
    // ==========================================

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

    // ==========================================
    // CATEGORY VALIDATION
    // ==========================================

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
      typeof status !==
        "string" ||
      !VALID_STATUSES.includes(
        status as (typeof VALID_STATUSES)[number]
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

    // ==========================================
    // PRIORITY VALIDATION
    // ==========================================

    if (
      typeof priority !==
        "string" ||
      !VALID_PRIORITIES.includes(
        priority as (typeof VALID_PRIORITIES)[number]
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

    // ==========================================
    // VALIDATE PROJECT
    // ==========================================

    let projectId:
      | mongoose.Types.ObjectId
      | null
      | undefined;

    if (
      body.projectId === null ||
      body.projectId === ""
    ) {
      projectId = null;
    } else if (
      body.projectId !== undefined
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

      const membership =
        await ProjectMember.findOne({
          projectId:
            body.projectId,
          userId:
            authUser.userId,
        })
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
    // DETERMINE EFFECTIVE PROJECT
    // ==========================================

    const effectiveProjectId =
      projectId !== undefined
        ? projectId
        : existingTask.projectId;

    // ==========================================
    // VALIDATE ASSIGNMENT
    // ==========================================

    let assignedTo:
      | mongoose.Types.ObjectId
      | null
      | undefined;

    if (
      body.assignedTo === null ||
      body.assignedTo === ""
    ) {
      assignedTo = null;
    } else if (
      body.assignedTo !== undefined
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

      // If the task belongs to a project,
      // the assignee must be a project member.
      if (effectiveProjectId) {
        const assigneeMembership =
          await ProjectMember.findOne({
            projectId:
              effectiveProjectId,
            userId:
              body.assignedTo,
          })
            .select("_id")
            .lean();

        if (!assigneeMembership) {
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
    // VALIDATE ORDER
    // ==========================================

    let newOrder:
      | number
      | undefined;

    if (
      body.order !== undefined
    ) {
      if (
        typeof body.order !==
          "number" ||
        !Number.isFinite(
          body.order
        ) ||
        !Number.isInteger(
          body.order
        ) ||
        body.order < 0
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid task order",
          },
          {
            status: 400,
          }
        );
      }

      newOrder =
        body.order;
    }

    // ==========================================
    // DETERMINE CHANGES
    // ==========================================

    const newAssignedTo =
      body.assignedTo !==
      undefined
        ? assignedTo
          ? assignedTo.toString()
          : null
        : previousAssignedTo;

    const newProjectId =
      body.projectId !==
      undefined
        ? projectId
          ? projectId.toString()
          : null
        : previousProjectId;

    const hasTitleChange =
      previousTitle !== title;

    const hasDescriptionChange =
      previousDescription !==
      description;

    const hasDueDateChange =
      previousDueDate !==
      dueDate;

    const hasCategoryChange =
      previousCategory !==
      category;

    const hasStatusChange =
      previousStatus !==
      status;

    const hasPriorityChange =
      previousPriority !==
      priority;

    const hasAssignmentChange =
      previousAssignedTo !==
      newAssignedTo;

    const hasProjectChange =
      previousProjectId !==
      newProjectId;

    const hasOrderChange =
      newOrder !== undefined &&
      previousOrder !==
        newOrder;

    const hasGeneralChanges =
      hasTitleChange ||
      hasDescriptionChange ||
      hasDueDateChange ||
      hasCategoryChange;

    // ==========================================
    // UPDATE TASK
    // ==========================================

    existingTask.title =
      title;

    existingTask.description =
      description;

    existingTask.dueDate =
      dueDate;

    existingTask.category =
      category;

    existingTask.status =
      status;

    existingTask.priority =
      priority;

    // ==========================================
    // UPDATE PROJECT
    // ==========================================

    if (
      body.projectId !==
      undefined
    ) {
      existingTask.projectId =
        projectId ??
        undefined;
    }

    // ==========================================
    // UPDATE ORDER
    // ==========================================

    if (
      newOrder !== undefined
    ) {
      existingTask.order =
        newOrder;
    }

    // ==========================================
    // UPDATE ASSIGNMENT
    // ==========================================

    if (
      body.assignedTo !==
      undefined
    ) {
      existingTask.assignedTo =
        assignedTo ??
        undefined;
    }

    // ==========================================
    // SAVE
    // ==========================================

    await existingTask.save();

    // ==========================================
    // ACTIVITY: STATUS CHANGE
    // ==========================================

    if (hasStatusChange) {
      await logActivity({
        userId:
          authUser.userId,

        taskId:
          existingTask._id,

        action:
          "Status Changed",

        description:
          `Changed status of "${existingTask.title}" from "${previousStatus}" to "${status}"`,
      });
    }

    // ==========================================
    // ACTIVITY: PRIORITY CHANGE
    // ==========================================

    if (hasPriorityChange) {
      await logActivity({
        userId:
          authUser.userId,

        taskId:
          existingTask._id,

        action:
          "Priority Changed",

        description:
          `Changed priority of "${existingTask.title}" from "${previousPriority}" to "${priority}"`,
      });
    }

    // ==========================================
    // ACTIVITY: ASSIGNMENT CHANGE
    // ==========================================

    if (hasAssignmentChange) {
      if (
        existingTask.assignedTo
      ) {
        await logActivity({
          userId:
            authUser.userId,

          taskId:
            existingTask._id,

          action:
            "Task Assigned",

          description:
            `Assigned "${existingTask.title}" to a team member`,
        });
      } else {
        await logActivity({
          userId:
            authUser.userId,

          taskId:
            existingTask._id,

          action:
            "Task Unassigned",

          description:
            `Unassigned "${existingTask.title}"`,
        });
      }
    }

    // ==========================================
    // ACTIVITY: PROJECT CHANGE
    // ==========================================

    if (hasProjectChange) {
      if (
        existingTask.projectId
      ) {
        await logActivity({
          userId:
            authUser.userId,

          taskId:
            existingTask._id,

          action:
            "Task Updated",

          description:
            `Added "${existingTask.title}" to a project`,
        });
      } else {
        await logActivity({
          userId:
            authUser.userId,

          taskId:
            existingTask._id,

          action:
            "Task Updated",

          description:
            `Removed "${existingTask.title}" from its project`,
        });
      }
    }

    // ==========================================
    // ACTIVITY: GENERAL UPDATE
    // ==========================================

    if (hasGeneralChanges) {
      await logActivity({
        userId:
          authUser.userId,

        taskId:
          existingTask._id,

        action:
          "Task Updated",

        description:
          `Updated task "${existingTask.title}"`,
      });
    }

    // ==========================================
    // ACTIVITY: ORDER CHANGE
    // ==========================================
    //
    // No activity is created for drag/drop
    // order changes because reordering can
    // generate many operations.
    //

    void hasOrderChange;

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        id:
          existingTask._id.toString(),

        title:
          existingTask.title,

        description:
          existingTask.description,

        dueDate:
          existingTask.dueDate,

        category:
          existingTask.category,

        status:
          existingTask.status,

        priority:
          existingTask.priority,

        order:
          existingTask.order,

        projectId:
          existingTask.projectId
            ? existingTask.projectId.toString()
            : null,

        assignedTo:
          existingTask.assignedTo
            ? existingTask.assignedTo.toString()
            : null,

        createdAt:
          existingTask.createdAt,

        updatedAt:
          existingTask.updatedAt,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "UPDATE TASK ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update task",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// DELETE TASK
// ==========================================

export async function DELETE(
  request: Request,
  context: RouteContext
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
    // TASK ID
    // ==========================================

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid task ID",
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
    // FIND TASK
    // ==========================================

    const task =
      await Task.findOne({
        _id: id,
        userId:
          authUser.userId,
      });

    if (!task) {
      return NextResponse.json(
        {
          error:
            "Task not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // SAVE VALUES BEFORE DELETE
    // ==========================================

    const taskTitle =
      task.title;

    const taskId =
      task._id;

    // ==========================================
    // DELETE TASK
    // ==========================================

    await Task.deleteOne({
      _id: id,
      userId:
        authUser.userId,
    });

    // ==========================================
    // ACTIVITY: TASK DELETED
    // ==========================================

    await logActivity({
      userId:
        authUser.userId,

      taskId,

      action:
        "Task Deleted",

      description:
        `Deleted task "${taskTitle}"`,
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        message:
          "Task deleted successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "DELETE TASK ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete task",
      },
      {
        status: 500,
      }
    );
  }
}