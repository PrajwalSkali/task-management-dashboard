import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Task from "@/lib/task";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const tasks = await Task.find({
      assignedTo: authUser.userId,
    })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const formattedTasks = tasks.map((task) => ({
      id: task._id.toString(),
      userId: task.userId.toString(),
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
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return NextResponse.json(formattedTasks, {
      status: 200,
    });
  } catch (error) {
    console.error("GET TEAM TASKS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch assigned tasks" },
      { status: 500 }
    );
  }
}