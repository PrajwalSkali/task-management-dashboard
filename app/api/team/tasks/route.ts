import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Task from "@/lib/task";
import User from "@/lib/user";
import { getAuthUser } from "@/lib/auth";

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

    await connectDB();

    const tasks = await Task.find({
      assignedTo: authUser.userId,
    })
      .sort({
        order: 1,
        createdAt: -1,
      })
      .lean();

    const ownerIds = [
      ...new Set(
        tasks.map((task) =>
          task.userId.toString()
        )
      ),
    ];

    const owners =
      ownerIds.length > 0
        ? await User.find({
            _id: {
              $in: ownerIds,
            },
          })
            .select("_id name email")
            .lean()
        : [];

    const ownerMap = new Map(
      owners.map((owner) => [
        owner._id.toString(),
        {
          id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
        },
      ])
    );

    const formattedTasks = tasks.map((task) => {
      const owner = ownerMap.get(
        task.userId.toString()
      );

      return {
        id: task._id.toString(),

        userId: task.userId.toString(),

        owner: owner || null,

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
      };
    });

    return NextResponse.json(
      formattedTasks,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET TEAM TASKS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch assigned tasks",
      },
      {
        status: 500,
      }
    );
  }
}