import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Category from "@/lib/category";
import { getAuthUser } from "@/lib/auth";

// ==========================================
// GET ALL CATEGORIES
// ==========================================

export async function GET() {
  try {
    const authUser = await getAuthUser();

    // Authentication check
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    console.log(
      "CATEGORY GET USER ID:",
      authUser.userId
    );

    // Get only categories belonging to logged-in user
    const categories = await Category.find({
      userId: authUser.userId,
    })
      .sort({ createdAt: 1 })
      .lean();

    console.log(
      "CATEGORIES FOUND:",
      categories.length
    );

    return NextResponse.json(
      categories,
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "CATEGORY GET ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// ==========================================
// CREATE CATEGORY
// ==========================================

export async function POST(request: Request) {
  try {
    // --------------------------------------
    // 1. CHECK AUTHENTICATION
    // --------------------------------------

    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // --------------------------------------
    // 2. CONNECT DATABASE
    // --------------------------------------

    await connectDB();

    // --------------------------------------
    // 3. READ REQUEST BODY
    // --------------------------------------

    let body;

    try {
      body = await request.json();
    } catch (error) {
      console.error(
        "INVALID JSON BODY:",
        error
      );

      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // --------------------------------------
    // 4. VALIDATE CATEGORY NAME
    // --------------------------------------

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          error: "Category name is required",
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          error:
            "Category name cannot exceed 100 characters",
        },
        { status: 400 }
      );
    }

    // --------------------------------------
    // 5. CHECK DUPLICATE CATEGORY
    // --------------------------------------

    const existingCategory =
      await Category.findOne({
        userId: authUser.userId,
        name: {
          $regex: `^${escapeRegex(name)}$`,
          $options: "i",
        },
      });

    if (existingCategory) {
      console.log(
        "DUPLICATE CATEGORY:",
        name
      );

      return NextResponse.json(
        {
          error: "Category already exists",
        },
        { status: 409 }
      );
    }

    // --------------------------------------
    // 6. CREATE CATEGORY
    // --------------------------------------

    const category = await Category.create({
      name,
      userId: authUser.userId,
    });

    console.log(
      "CATEGORY CREATED:",
      category
    );

    // --------------------------------------
    // 7. SUCCESS RESPONSE
    // --------------------------------------

    return NextResponse.json(
      category,
      { status: 201 }
    );
  } catch (error: any) {
    // --------------------------------------
    // 8. HANDLE DUPLICATE KEY ERROR
    // --------------------------------------

    if (error?.code === 11000) {
      console.error(
        "MONGODB DUPLICATE KEY ERROR:",
        error
      );

      return NextResponse.json(
        {
          error: "Category already exists",
        },
        { status: 409 }
      );
    }

    // --------------------------------------
    // 9. HANDLE VALIDATION ERROR
    // --------------------------------------

    if (error?.name === "ValidationError") {
      console.error(
        "CATEGORY VALIDATION ERROR:",
        error
      );

      return NextResponse.json(
        {
          error: "Invalid category data",
        },
        { status: 400 }
      );
    }

    // --------------------------------------
    // 10. HANDLE OTHER SERVER ERRORS
    // --------------------------------------

    console.error(
      "CATEGORY POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to create category",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// ESCAPE REGEX SPECIAL CHARACTERS
// ==========================================

function escapeRegex(value: string): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}