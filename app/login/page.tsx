"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type User = {
  name: string;
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();

    setError("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError("Please enter email and password.");
      return;
    }

    // Get registered user
    const storedUser = localStorage.getItem(
      "taskflowUser"
    );

    if (!storedUser) {
      setError(
        "No account found. Please register first."
      );
      return;
    }

    try {
      const user: User = JSON.parse(storedUser);

      // Verify email and password
      if (
        user.email.toLowerCase() === trimmedEmail &&
        user.password === password
      ) {
        // Create login session
        localStorage.setItem(
          "isLoggedIn",
          "true"
        );

        localStorage.setItem(
          "userEmail",
          user.email
        );

        localStorage.setItem(
          "loggedInUser",
          JSON.stringify({
            name: user.name,
            email: user.email,
          })
        );

        router.push("/");
      } else {
        setError("Invalid email or password.");
      }
    } catch {
      setError(
        "Something went wrong. Please register again."
      );
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome Back
          </h1>

          <p className="mt-2 text-gray-500">
            Login to your TaskFlow account
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        {/* Register */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{" "}

          <button
            type="button"
            onClick={() =>
              router.push("/register")
            }
            className="font-medium text-blue-600 hover:underline"
          >
            Register
          </button>
        </p>

      </div>
    </main>
  );
}