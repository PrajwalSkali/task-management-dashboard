import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Comment from "@/lib/comment";
import Task from "@/lib/task";
import User from "@/lib/user";
import ProjectMember from "@/lib/projectMember";
import { getAuthUser } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

// ==========================================
// CONSTANTS
// ==========================================

const MAX_COMMENT_LENGTH = 1000;

// ==========================================
// TYPES
// ==========================================

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ==========================================
// UPDATE COMMENT
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
    // VALIDATE AUTHENTICATED USER ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(
        authUser.userId
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid authenticated user",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // COMMENT ID
    // ==========================================

    const { id } = await context.params;

    const commentId = id.trim();

    if (
      !mongoose.Types.ObjectId.isValid(
        commentId
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid comment ID",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // REQUEST BODY
    // ==========================================

    let body: Record<
      string,
      unknown
    >;

    try {
      const parsed = await request.json();

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
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

      body =
        parsed as Record<
          string,
          unknown
        >;
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

    // ==========================================
    // READ CONTENT
    // ==========================================

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    // ==========================================
    // VALIDATE CONTENT
    // ==========================================

    if (!content) {
      return NextResponse.json(
        {
          error:
            "Comment cannot be empty",
        },
        {
          status: 400,
        }
      );
    }

    if (
      content.length >
      MAX_COMMENT_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`,
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
    // FIND COMMENT
    // ==========================================

    // Only the comment author can update it.
    const comment =
      await Comment.findOne({
        _id: commentId,
        userId: authUser.userId,
      });

    if (!comment) {
      return NextResponse.json(
        {
          error:
            "Comment not found or access denied",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // FIND RELATED TASK
    // ==========================================

    const task =
      await Task.findById(
        comment.taskId
      )
        .select(
          "_id userId projectId"
        )
        .lean();

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

    // ==========================================
    // CHECK TASK ACCESS
    // ==========================================

    const isTaskOwner =
      task.userId.toString() ===
      authUser.userId.toString();

    let isProjectMember = false;

    if (
      task.projectId &&
      !isTaskOwner
    ) {
      const membership =
        await ProjectMember.findOne({
          projectId:
            task.projectId,
          userId:
            authUser.userId,
        })
          .select("_id")
          .lean();

      isProjectMember =
        Boolean(membership);
    }

    if (
      !isTaskOwner &&
      !isProjectMember
    ) {
      return NextResponse.json(
        {
          error:
            "Task not found or access denied",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // UPDATE COMMENT
    // ==========================================

    const previousContent =
      comment.content;

    comment.content = content;

    await comment.save();

    // ==========================================
    // ACTIVITY LOG
    // ==========================================

    if (
      previousContent !== content
    ) {
      await logActivity({
        userId:
          authUser.userId,

        taskId:
          comment.taskId,

        action:
          "Comment Updated",

        description:
          "Updated a comment on a task",
      });
    }

    // ==========================================
    // GET COMMENT AUTHOR
    // ==========================================

    const user =
      await User.findById(
        comment.userId
      )
        .select(
          "_id name email"
        )
        .lean();

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        id:
          comment._id.toString(),

        taskId:
          comment.taskId.toString(),

        content:
          comment.content,

        user: user
          ? {
              id:
                user._id.toString(),

              name:
                user.name,

              email:
                user.email,
            }
          : null,

        createdAt:
          comment.createdAt,

        updatedAt:
          comment.updatedAt,

        canEdit: true,

        canDelete: true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "UPDATE COMMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update comment",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// DELETE COMMENT
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
          error: "Unauthorized",
        },
        {
          status: 401,
        }
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
    // COMMENT ID
    // ==========================================

    const { id } =
      await context.params;

    const commentId = id.trim();

    if (
      !mongoose.Types.ObjectId.isValid(
        commentId
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid comment ID",
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
    // FIND COMMENT
    // ==========================================

    // Only the comment author can delete it.
    const comment =
      await Comment.findOne({
        _id: commentId,
        userId:
          authUser.userId,
      });

    if (!comment) {
      return NextResponse.json(
        {
          error:
            "Comment not found or access denied",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // FIND RELATED TASK
    // ==========================================

    const task =
      await Task.findById(
        comment.taskId
      )
        .select(
          "_id userId projectId"
        )
        .lean();

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

    // ==========================================
    // CHECK TASK ACCESS
    // ==========================================

    const isTaskOwner =
      task.userId.toString() ===
      authUser.userId.toString();

    let isProjectMember =
      false;

    if (
      task.projectId &&
      !isTaskOwner
    ) {
      const membership =
        await ProjectMember.findOne({
          projectId:
            task.projectId,
          userId:
            authUser.userId,
        })
          .select("_id")
          .lean();

      isProjectMember =
        Boolean(membership);
    }

    if (
      !isTaskOwner &&
      !isProjectMember
    ) {
      return NextResponse.json(
        {
          error:
            "Task not found or access denied",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // SAVE VALUES BEFORE DELETE
    // ==========================================

    const taskId =
      comment.taskId;

    // ==========================================
    // DELETE COMMENT
    // ==========================================

    const deleteResult =
      await Comment.deleteOne({
        _id: commentId,
        userId:
          authUser.userId,
      });

    if (
      deleteResult.deletedCount !== 1
    ) {
      return NextResponse.json(
        {
          error:
            "Comment could not be deleted",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================
    // ACTIVITY LOG
    // ==========================================

    await logActivity({
      userId:
        authUser.userId,

      taskId,

      action:
        "Comment Deleted",

      description:
        "Deleted a comment from a task",
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        message:
          "Comment deleted successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "DELETE COMMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete comment",
      },
      {
        status: 500,
      }
    );
  }
}