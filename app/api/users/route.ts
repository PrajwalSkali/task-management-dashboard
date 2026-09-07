import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import User from "@/lib/user";
import { getAuthUser } from "@/lib/auth";

// ==========================================
// GET TEAM MEMBERS
// ==========================================

export async function GET() {
  try {
    // ------------------------------------------
    // CHECK AUTHENTICATION
    // ------------------------------------------

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

    // ------------------------------------------
    // VALIDATE AUTHENTICATED USER
    // ------------------------------------------

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

    // ------------------------------------------
    // CONNECT DATABASE
    // ------------------------------------------

    await connectDB();

    // ------------------------------------------
    // GET USERS
    // ------------------------------------------
    // Password is deliberately excluded.
    // Only information required for team
    // member selection is returned.

    const users = await User.find({})
      .select("_id name email")
      .sort({
        name: 1,
      })
      .lean();

    // ------------------------------------------
    // FORMAT RESPONSE
    // ------------------------------------------

    const formattedUsers = users.map(
      (user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      })
    );

    return NextResponse.json(
      formattedUsers,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET TEAM MEMBERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch team members",
      },
      {
        status: 500,
      }
    );
  }
}