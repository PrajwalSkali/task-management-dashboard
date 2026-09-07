import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Settings from "@/lib/settings";

// ==========================================
// GET SETTINGS
// ==========================================

export async function GET() {
  try {
    await connectDB();

    let settings = await Settings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({
        theme: "Light",
        showCompleted: true,
        defaultPriority: "Medium",
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch settings",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// UPDATE SETTINGS
// ==========================================

export async function PUT(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const settings = await Settings.findOneAndUpdate(
      {},
      {
        theme: body.theme,
        showCompleted: body.showCompleted,
        defaultPriority: body.defaultPriority,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error("UPDATE SETTINGS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to update settings",
      },
      { status: 500 }
    );
  }
}