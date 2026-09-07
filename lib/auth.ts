import { cookies } from "next/headers";
import jwt, {
  JwtPayload,
} from "jsonwebtoken";

// ==========================================
// AUTH USER TYPE
// ==========================================

export type AuthUser = {
  userId: string;
  email: string;
  name: string;
};

// ==========================================
// GET AUTHENTICATED USER
// ==========================================

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    // ==========================================
    // GET AUTH COOKIE
    // ==========================================

    const cookieStore = await cookies();

    const token =
      cookieStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    // ==========================================
    // JWT SECRET
    // ==========================================

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(
        "JWT_SECRET is not defined in .env.local"
      );
    }

    // ==========================================
    // VERIFY JWT
    // ==========================================

    const decoded = jwt.verify(
      token,
      secret
    );

    // ==========================================
    // VALIDATE JWT PAYLOAD
    // ==========================================

    if (
      typeof decoded !== "object" ||
      decoded === null
    ) {
      return null;
    }

    const payload =
      decoded as JwtPayload;

    const userId =
      typeof payload.userId === "string"
        ? payload.userId.trim()
        : "";

    const email =
      typeof payload.email === "string"
        ? payload.email.trim()
        : "";

    const name =
      typeof payload.name === "string"
        ? payload.name.trim()
        : "";

    // ==========================================
    // REQUIRED PAYLOAD VALIDATION
    // ==========================================

    if (!userId || !email || !name) {
      return null;
    }

    // ==========================================
    // USER ID VALIDATION
    // ==========================================

    // Avoid importing Mongoose into this
    // authentication utility.
    // API routes validate the ObjectId before
    // database operations.
    if (userId.length !== 24) {
      return null;
    }

    // ==========================================
    // RETURN AUTH USER
    // ==========================================

    return {
      userId,
      email,
      name,
    };
  } catch (error) {
    console.error(
      "Authentication failed:",
      error
    );

    return null;
  }
}