import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import User from "@/lib/user";

export async function POST(request: Request) {
  try {
    // ==========================================
    // READ REQUEST
    // ==========================================

    let body: {
      email?: unknown;
      password?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // ==========================================
    // VALIDATE INPUT
    // ==========================================

    if (!email || !password) {
      return NextResponse.json(
        {
          error:
            "Email and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    // Validate email format
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    // Prevent excessively large password input
    if (password.length > 128) {
      return NextResponse.json(
        {
          error: "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // CONNECT TO DATABASE
    // ==========================================

    await connectDB();

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // COMPARE PASSWORD
    // ==========================================

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return NextResponse.json(
        {
          error:
            "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // JWT SECRET
    // ==========================================

    const secret =
      process.env.JWT_SECRET;

    if (!secret) {
      console.error(
        "JWT_SECRET is missing."
      );

      return NextResponse.json(
        {
          error:
            "Authentication service is not configured correctly.",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // CREATE JWT
    // ==========================================

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      secret,
      {
        expiresIn: "7d",
      }
    );

    // ==========================================
    // CREATE RESPONSE
    // ==========================================

    const response =
      NextResponse.json(
        {
          message:
            "Login successful",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
        },
        {
          status: 200,
        }
      );

    // ==========================================
    // HTTP-ONLY AUTH COOKIE
    // ==========================================

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error(
      "LOGIN FAILED:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to login. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}