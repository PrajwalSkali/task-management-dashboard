import mongoose from "mongoose";

import Activity, {
  type ActivityAction,
} from "@/lib/activity";

// ==========================================
// CREATE ACTIVITY LOG
// ==========================================

export async function logActivity({
  userId,
  taskId,
  action,
  description,
}: {
  userId: string | mongoose.Types.ObjectId;
  taskId?: string | mongoose.Types.ObjectId;
  action: ActivityAction;
  description: string;
}) {
  try {
    // ==========================================
    // VALIDATE USER ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      console.error(
        "ACTIVITY LOG ERROR: Invalid user ID"
      );

      return;
    }

    // ==========================================
    // VALIDATE TASK ID
    // ==========================================

    if (
      taskId !== undefined &&
      !mongoose.Types.ObjectId.isValid(
        taskId
      )
    ) {
      console.error(
        "ACTIVITY LOG ERROR: Invalid task ID"
      );

      return;
    }

    // ==========================================
    // VALIDATE DESCRIPTION
    // ==========================================

    const cleanDescription =
      typeof description === "string"
        ? description.trim()
        : "";

    if (!cleanDescription) {
      console.error(
        "ACTIVITY LOG ERROR: Description is required"
      );

      return;
    }

    if (
      cleanDescription.length > 500
    ) {
      console.error(
        "ACTIVITY LOG ERROR: Description is too long"
      );

      return;
    }

    // ==========================================
    // CREATE ACTIVITY
    // ==========================================

    await Activity.create({
      userId:
        typeof userId === "string"
          ? new mongoose.Types.ObjectId(
              userId
            )
          : userId,

      taskId:
        taskId !== undefined
          ? typeof taskId === "string"
            ? new mongoose.Types.ObjectId(
                taskId
              )
            : taskId
          : undefined,

      action,

      description:
        cleanDescription,
    });
  } catch (error) {
    // Activity logging should never break
    // the main task/comment operation.
    console.error(
      "ACTIVITY LOG ERROR:",
      error
    );
  }
}