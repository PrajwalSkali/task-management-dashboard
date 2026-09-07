"use client";

export default function Sidebar() {
  return (
    <>
      {/* ==========================================
          DESKTOP SIDEBAR
      ========================================== */}

      <aside className="hidden min-h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-slate-200 bg-white md:block">
        <div className="flex h-full flex-col p-4">

          {/* SIDEBAR BRAND */}

          <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg font-bold text-blue-600 shadow-sm">
                ✓
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">
                  TaskFlow
                </p>

                <p className="truncate text-[11px] text-blue-100">
                  Productivity workspace
                </p>
              </div>
            </div>
          </div>

          {/* NAVIGATION LABEL */}

          <div className="mb-3 px-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Workspace
            </p>
          </div>

          <nav className="space-y-1.5">

            {/* DASHBOARD */}

            <a
              href="/"
              className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-3 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-blue-100 transition hover:shadow"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm text-white shadow-sm">
                ◉
              </span>

              <span className="min-w-0 truncate">
                Dashboard
              </span>

              <span className="ml-auto text-xs text-blue-400">
                →
              </span>
            </a>

            {/* MY TASKS */}

            <a
              href="/tasks"
              className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm transition group-hover:bg-blue-100 group-hover:text-blue-600">
                ✓
              </span>

              <span className="min-w-0 truncate">
                My Tasks
              </span>
            </a>

            {/* TEAM */}

            <a
              href="/team"
              className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-purple-50 hover:text-purple-600"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm transition group-hover:bg-purple-100 group-hover:text-purple-600">
                👥
              </span>

              <span className="min-w-0 truncate">
                Team Workspace
              </span>
            </a>

            {/* PROJECTS */}

            <a
              href="/projects"
              className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm transition group-hover:bg-indigo-100 group-hover:text-indigo-600">
                ▣
              </span>

              <span className="min-w-0 truncate">
                Projects
              </span>
            </a>

            {/* CATEGORIES */}

            <a
              href="/categories"
              className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm transition group-hover:bg-emerald-100 group-hover:text-emerald-600">
                ◈
              </span>

              <span className="min-w-0 truncate">
                Categories
              </span>
            </a>

          </nav>

          {/* DIVIDER */}

          <div className="my-6 border-t border-slate-100" />

          {/* SETTINGS LABEL */}

          <div className="mb-3 px-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Account
            </p>
          </div>

          {/* SETTINGS */}

          <nav>
            <a
              href="/settings"
              className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm transition group-hover:bg-slate-200">
                ⚙
              </span>

              <span className="min-w-0 truncate">
                Settings
              </span>
            </a>
          </nav>

          {/* SIDEBAR FOOTER */}

          <div className="mt-auto pt-6">
            <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 p-4">

              <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-blue-100/60" />

              <div className="relative">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
                    ✓
                  </div>

                  <span className="text-sm font-bold text-slate-700">
                    TaskFlow
                  </span>
                </div>

                <p className="text-xs leading-5 text-slate-500">
                  Stay organized, track progress, and get things done.
                </p>
              </div>

            </div>
          </div>

        </div>
      </aside>

      {/* ==========================================
          MOBILE NAVIGATION
          LEFT UNCHANGED
      ========================================== */}

      <div className="w-full border-b bg-white md:hidden">
        <nav className="flex w-full min-w-0 max-w-full gap-1 overflow-x-auto px-2 py-2">
          <a
            href="/"
            className="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600"
          >
            Dashboard
          </a>

          <a
            href="/tasks"
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Tasks
          </a>

          <a
            href="/team"
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Team
          </a>

          <a
            href="/projects"
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Projects
          </a>

          <a
            href="/categories"
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Categories
          </a>

          <a
            href="/settings"
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Settings
          </a>
        </nav>
      </div>
    </>
  );
}