import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/lib/category";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { category } = await params;
    const categoryName = decodeURIComponent(category).trim();

    if (!categoryName) {
      return NextResponse.json(
        { error: "Category name is required." },
        { status: 400 }
      );
    }

    const deletedCategory = await Category.findOneAndDelete({
      name: categoryName,
      userId: authUser.userId,
    });

    if (!deletedCategory) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/categories/[category] error:", error);

    return NextResponse.json(
      { error: "Failed to delete category." },
      { status: 500 }
    );
  }
}