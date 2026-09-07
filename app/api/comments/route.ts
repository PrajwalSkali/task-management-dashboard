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
// GET COMMENTS FOR A TASK
// ==========================================

export async function GET(request: Request) {
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
    // GET TASK ID
    // ==========================================

    const { searchParams } =
      new URL(request.url);

    const taskId =
      searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        {
          error: "Task ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        taskId
      )
    ) {
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
    // FIND TASK
    // ==========================================

    const task =
      await Task.findById(taskId)
        .select("_id userId projectId")
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
    // CHECK ACCESS
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
    // GET COMMENTS
    // ==========================================

    const comments =
      await Comment.find({
        taskId,
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    // ==========================================
    // GET COMMENT USERS
    // ==========================================

    const userIds = [
      ...new Set(
        comments.map(
          (comment) =>
            comment.userId.toString()
        )
      ),
    ].filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
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

    const userMap = new Map(
      users.map(
        (user) => [
          user._id.toString(),
          {
            id:
              user._id.toString(),
            name: user.name,
            email: user.email,
          },
        ]
      )
    );

    // ==========================================
    // FORMAT COMMENTS
    // ==========================================

    const formattedComments =
      comments.map(
        (comment) => {
          const isCommentAuthor =
            comment.userId.toString() ===
            authUser.userId.toString();

          return {
            id:
              comment._id.toString(),

            taskId:
              comment.taskId.toString(),

            content:
              comment.content,

            user:
              userMap.get(
                comment.userId.toString()
              ) || null,

            createdAt:
              comment.createdAt,

            updatedAt:
              comment.updatedAt,

            // Only the comment author
            // can edit/delete.
            canEdit:
              isCommentAuthor,

            canDelete:
              isCommentAuthor,
          };
        }
      );

    return NextResponse.json(
      formattedComments,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET COMMENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch comments",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// CREATE COMMENT
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
    // DATABASE
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
    // READ DATA
    // ==========================================

    const taskId =
      typeof body.taskId ===
      "string"
        ? body.taskId.trim()
        : "";

    const content =
      typeof body.content ===
      "string"
        ? body.content.trim()
        : "";

    // ==========================================
    // VALIDATE TASK ID
    // ==========================================

    if (!taskId) {
      return NextResponse.json(
        {
          error:
            "Task ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        taskId
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
    // VALIDATE COMMENT
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
    // FIND TASK
    // ==========================================

    const task =
      await Task.findById(taskId)
        .select(
          "_id userId projectId"
        )
        .lean();

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
    // CHECK ACCESS
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
    // CREATE COMMENT
    // ==========================================

    const comment =
      await Comment.create({
        taskId:
          new mongoose.Types.ObjectId(
            taskId
          ),

        userId:
          new mongoose.Types.ObjectId(
            authUser.userId
          ),

        content,
      });

    // ==========================================
    // ACTIVITY LOG
    // ==========================================

    await logActivity({
      userId:
        authUser.userId,

      taskId:
        comment.taskId,

      action:
        "Comment Added",

      description:
        "Added a comment to task",
    });

    // ==========================================
    // GET COMMENT AUTHOR
    // ==========================================

    const user =
      await User.findById(
        authUser.userId
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
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE COMMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create comment",
      },
      {
        status: 500,
      }
    );
  }
}