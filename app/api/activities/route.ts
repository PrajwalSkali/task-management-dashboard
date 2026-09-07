import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Activity from "@/lib/activity";
import Task from "@/lib/task";
import User from "@/lib/user";
import ProjectMember from "@/lib/projectMember";
import { getAuthUser } from "@/lib/auth";

// ==========================================
// GET ACTIVITY HISTORY
// ==========================================

export async function GET(request: Request) {
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

    const { searchParams } =
      new URL(request.url);

    const taskId =
      searchParams.get("taskId");

    const projectId =
      searchParams.get("projectId");

    // ==========================================
    // VALIDATE FILTER IDS
    // ==========================================

    if (
      taskId &&
      !mongoose.Types.ObjectId.isValid(taskId)
    ) {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }

    if (
      projectId &&
      !mongoose.Types.ObjectId.isValid(projectId)
    ) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    // ==========================================
    // VALIDATE LIMIT
    // ==========================================

    const limitParam =
      searchParams.get("limit");

    const requestedLimit =
      Number(limitParam);

    const limit =
      Number.isFinite(requestedLimit) &&
      requestedLimit > 0
        ? Math.min(
            Math.floor(requestedLimit),
            100
          )
        : 50;

    await connectDB();

    // ==========================================
    // SPECIFIC TASK ACCESS
    // ==========================================

    if (taskId) {
      const task =
        await Task.findById(taskId)
          .select(
            "_id projectId userId"
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
      // PERSONAL TASK
      // ==========================================

      if (!task.projectId) {
        if (
          task.userId.toString() !==
          authUser.userId.toString()
        ) {
          return NextResponse.json(
            {
              error: "Access denied",
            },
            {
              status: 403,
            }
          );
        }
      }

      // ==========================================
      // PROJECT TASK
      // ==========================================

      else {
        const membership =
          await ProjectMember.findOne({
            projectId:
              task.projectId,
            userId:
              authUser.userId,
          })
            .select("_id")
            .lean();

        if (!membership) {
          return NextResponse.json(
            {
              error: "Access denied",
            },
            {
              status: 403,
            }
          );
        }
      }

      // ==========================================
      // LOAD TASK ACTIVITIES
      // ==========================================

      const activities =
        await Activity.find({
          taskId: task._id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(limit)
          .lean();

      return await formatActivities(
        activities
      );
    }

    // ==========================================
    // SPECIFIC PROJECT ACCESS
    // ==========================================

    if (projectId) {
      const membership =
        await ProjectMember.findOne({
          projectId,
          userId: authUser.userId,
        })
          .select("_id")
          .lean();

      if (!membership) {
        return NextResponse.json(
          {
            error: "Access denied",
          },
          {
            status: 403,
          }
        );
      }

      // ==========================================
      // LOAD TASKS BELONGING TO PROJECT
      // ==========================================

      const projectTasks =
        await Task.find({
          projectId,
        })
          .select("_id")
          .lean();

      const projectTaskIds =
        projectTasks.map(
          (task) => task._id
        );

      // ==========================================
      // LOAD PROJECT + PROJECT TASK ACTIVITIES
      // ==========================================

      const activityConditions: any[] = [
        {
          projectId,
        },
      ];

      if (
        projectTaskIds.length > 0
      ) {
        activityConditions.push({
          taskId: {
            $in: projectTaskIds,
          },
        });
      }

      const activities =
        await Activity.find({
          $or: activityConditions,
        })
          .sort({
            createdAt: -1,
          })
          .limit(limit)
          .lean();

      return await formatActivities(
        activities
      );
    }

    // ==========================================
    // GENERAL ACTIVITY HISTORY
    // ==========================================

    const memberships =
      await ProjectMember.find({
        userId: authUser.userId,
      })
        .select("projectId")
        .lean();

    const projectIds =
      memberships.map(
        (membership) =>
          membership.projectId.toString()
      );

    // ==========================================
    // LOAD ACCESSIBLE TASKS
    // ==========================================

    const tasks =
      await Task.find({
        $or: [
          {
            userId:
              authUser.userId,
          },

          ...(projectIds.length > 0
            ? [
                {
                  projectId: {
                    $in: projectIds,
                  },
                },
              ]
            : []),
        ],
      })
        .select(
          "_id title projectId"
        )
        .lean();

    const taskIds =
      tasks.map((task) =>
        task._id.toString()
      );

    // ==========================================
    // LOAD GENERAL ACTIVITIES
    // ==========================================

    const activityConditions: any[] = [];

    if (taskIds.length > 0) {
      activityConditions.push({
        taskId: {
          $in: taskIds,
        },
      });
    }

    if (projectIds.length > 0) {
      activityConditions.push({
        projectId: {
          $in: projectIds,
        },
      });
    }

    // ==========================================
    // NO ACCESSIBLE ACTIVITIES
    // ==========================================

    if (
      activityConditions.length === 0
    ) {
      return NextResponse.json(
        [],
        {
          status: 200,
        }
      );
    }

    // ==========================================
    // LOAD ACTIVITIES
    // ==========================================

    const activities =
      await Activity.find({
        $or: activityConditions,
      })
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .lean();

    return await formatActivities(
      activities
    );
  } catch (error) {
    console.error(
      "GET ACTIVITIES ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch activity logs",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// FORMAT ACTIVITIES
// ==========================================

async function formatActivities(
  activities: any[]
) {
  // ==========================================
  // LOAD USERS
  // ==========================================

  const userIds = [
    ...new Set(
      activities.map(
        (activity) =>
          activity.userId.toString()
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
          .select(
            "_id name email"
          )
          .lean()
      : [];

  const userMap =
    new Map(
      users.map((user) => [
        user._id.toString(),
        {
          id:
            user._id.toString(),
          name: user.name,
          email: user.email,
        },
      ])
    );

  // ==========================================
  // LOAD TASKS
  // ==========================================

  const taskIds = [
    ...new Set(
      activities
        .filter(
          (activity) =>
            activity.taskId
        )
        .map(
          (activity) =>
            activity.taskId.toString()
        )
    ),
  ];

  const tasks =
    taskIds.length > 0
      ? await Task.find({
          _id: {
            $in: taskIds,
          },
        })
          .select(
            "_id title projectId"
          )
          .lean()
      : [];

  const taskMap =
    new Map(
      tasks.map((task) => [
        task._id.toString(),
        {
          id:
            task._id.toString(),

          title:
            task.title,

          projectId:
            task.projectId
              ? task.projectId.toString()
              : null,
        },
      ])
    );

  // ==========================================
  // FORMAT RESPONSE
  // ==========================================

  const formattedActivities =
    activities.map(
      (activity) => ({
        id:
          activity._id.toString(),

        taskId:
          activity.taskId
            ? activity.taskId.toString()
            : null,

        projectId:
          activity.projectId
            ? activity.projectId.toString()
            : null,

        task:
          activity.taskId
            ? taskMap.get(
                activity.taskId.toString()
              ) || null
            : null,

        action:
          activity.action,

        description:
          activity.description,

        user:
          userMap.get(
            activity.userId.toString()
          ) || null,

        createdAt:
          activity.createdAt,

        updatedAt:
          activity.updatedAt,
      })
    );

  return NextResponse.json(
    formattedActivities,
    {
      status: 200,
    }
  );
}