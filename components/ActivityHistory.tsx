"use client";

import { useEffect, useState } from "react";

type ActivityUser = {
  id: string;
  name: string;
  email: string;
};

type ActivityTask = {
  id: string;
  title: string;
  projectId: string | null;
};

type Activity = {
  id: string;
  taskId: string | null;
  task: ActivityTask | null;
  action: string;
  description: string;
  user: ActivityUser | null;
  createdAt: string;
  updatedAt: string;
};

type ActivityHistoryProps = {
  taskId?: string;
  projectId?: string;
  limit?: number;
};

const MAX_ACTIVITY_LIMIT = 100;
const DEFAULT_VISIBLE_ACTIVITIES = 5;

export default function ActivityHistory({
  taskId,
  projectId,
  limit = DEFAULT_VISIBLE_ACTIVITIES,
}: ActivityHistoryProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const visibleLimit = Math.min(
    Math.max(
      Number.isFinite(limit)
        ? Math.floor(limit)
        : DEFAULT_VISIBLE_ACTIVITIES,
      1
    ),
    DEFAULT_VISIBLE_ACTIVITIES
  );

  const buildParams = (activityLimit: number) => {
    const params = new URLSearchParams();

    if (taskId) {
      params.set("taskId", taskId);
    } else if (projectId) {
      params.set("projectId", projectId);
    }

    params.set("limit", String(activityLimit));

    return params.toString();
  };

  // Load only recent activities initially
  useEffect(() => {
    const loadRecentActivities = async () => {
      try {
        setLoading(true);
        setError("");
        setShowAll(false);

        const response = await fetch(
          `/api/activities?${buildParams(visibleLimit)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to fetch activities"
          );
        }

        setActivities(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Failed to load activities:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load activity history."
        );

        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecentActivities();
  }, [taskId, projectId, visibleLimit]);

  // Load complete history only when Show All is clicked
  const handleShowAll = async () => {
    if (showAll) {
      // Simply collapse the existing full list.
      setShowAll(false);
      return;
    }

    try {
      setLoadingAll(true);
      setError("");

      const response = await fetch(
        `/api/activities?${buildParams(
          MAX_ACTIVITY_LIMIT
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load complete history"
        );
      }

      setActivities(
        Array.isArray(data) ? data : []
      );

      setShowAll(true);
    } catch (error) {
      console.error(
        "Failed to load complete activity history:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load complete activity history."
      );
    } finally {
      setLoadingAll(false);
    }
  };

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "Task Created":
        return "＋";
      case "Task Updated":
        return "✎";
      case "Task Deleted":
        return "×";
      case "Task Assigned":
        return "👤";
      case "Task Unassigned":
        return "−";
      case "Status Changed":
        return "↻";
      case "Priority Changed":
        return "★";
      case "Comment Added":
        return "💬";
      case "Comment Updated":
        return "✎";
      case "Comment Deleted":
        return "×";
      default:
        return "•";
    }
  };

  const getActivityStyle = (action: string) => {
    switch (action) {
      case "Task Created":
        return {
          icon: "bg-emerald-100 text-emerald-600",
          badge: "bg-emerald-50 text-emerald-700",
        };

      case "Task Deleted":
      case "Comment Deleted":
        return {
          icon: "bg-red-100 text-red-600",
          badge: "bg-red-50 text-red-700",
        };

      case "Status Changed":
        return {
          icon: "bg-blue-100 text-blue-600",
          badge: "bg-blue-50 text-blue-700",
        };

      case "Priority Changed":
        return {
          icon: "bg-amber-100 text-amber-600",
          badge: "bg-amber-50 text-amber-700",
        };

      case "Task Assigned":
        return {
          icon: "bg-violet-100 text-violet-600",
          badge: "bg-violet-50 text-violet-700",
        };

      case "Task Unassigned":
        return {
          icon: "bg-slate-100 text-slate-600",
          badge: "bg-slate-100 text-slate-700",
        };

      case "Comment Added":
        return {
          icon: "bg-cyan-100 text-cyan-600",
          badge: "bg-cyan-50 text-cyan-700",
        };

      case "Task Updated":
      case "Comment Updated":
        return {
          icon: "bg-indigo-100 text-indigo-600",
          badge: "bg-indigo-50 text-indigo-700",
        };

      default:
        return {
          icon: "bg-slate-100 text-slate-600",
          badge: "bg-slate-100 text-slate-700",
        };
    }
  };

  const getScopeText = () => {
    if (taskId) {
      return "Task activity";
    }

    if (projectId) {
      return "Project activity";
    }

    return "Recent actions and changes";
  };

  /*
   * IMPORTANT:
   * When collapsed, ALWAYS display only the first 5.
   * When expanded, display the complete loaded history.
   */
  const displayedActivities = showAll
    ? activities
    : activities.slice(0, visibleLimit);

  const canShowAll =
    showAll || activities.length >= visibleLimit;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/60 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg text-white shadow-sm">
              ↻
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-800">
                Activity History
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                {getScopeText()}
              </p>
            </div>
          </div>

          <div className="self-start rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 sm:self-auto">
            {showAll
              ? activities.length
              : Math.min(
                  activities.length,
                  visibleLimit
                )}{" "}
            {showAll
              ? activities.length === 1
                ? "activity"
                : "activities"
              : "recent"}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-5 py-3 sm:px-6">
          <div className="flex items-start gap-2 text-sm text-red-600">
            <span>⚠</span>

            <span className="break-words">
              {error}
            </span>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="px-5 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
            <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
          </div>

          <p className="mt-4 text-sm font-bold text-slate-600">
            Loading activity...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Fetching recent changes
          </p>
        </div>
      ) : activities.length === 0 ? (
        /* Empty State */
        <div className="px-5 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
            ↻
          </div>

          <h4 className="mt-4 text-sm font-bold text-slate-700">
            No activity yet
          </h4>

          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
            Activity will appear here when tasks,
            comments, assignments, or other changes
            are made.
          </p>
        </div>
      ) : (
        <>
          {/* Activity List */}
          <div className="p-4 sm:p-6">
            <div className="relative">

              {/* Timeline */}
              <div className="absolute bottom-6 left-5 top-6 w-px bg-slate-200" />

              <div className="space-y-2">
                {displayedActivities.map(
                  (activity) => {
                    const style =
                      getActivityStyle(
                        activity.action
                      );

                    const userInitial = (
                      activity.user?.name || "U"
                    )
                      .charAt(0)
                      .toUpperCase();

                    return (
                      <div
                        key={activity.id}
                        className="group relative flex gap-3 rounded-2xl p-3 transition hover:bg-slate-50 sm:gap-4 sm:p-4"
                      >
                        {/* Icon */}
                        <div
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm ring-4 ring-white ${style.icon}`}
                        >
                          {getActivityIcon(
                            activity.action
                          )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-[10px] font-bold text-white">
                                {userInitial}
                              </div>

                              <span className="max-w-[160px] truncate text-sm font-bold text-slate-800 sm:max-w-[220px]">
                                {activity.user?.name ??
                                  "Unknown User"}
                              </span>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${style.badge}`}
                            >
                              {activity.action}
                            </span>
                          </div>

                          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                            <p className="break-words text-sm leading-6 text-slate-600">
                              {activity.description}
                            </p>
                          </div>

                          {activity.task && (
                            <div className="mt-3 flex min-w-0 items-center gap-2">
                              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Task
                              </span>

                              <span className="min-w-0 truncate rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                                {activity.task.title}
                              </span>
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {activity.user?.email && (
                              <span className="max-w-full truncate text-[11px] text-slate-400">
                                {activity.user.email}
                              </span>
                            )}

                            <span className="text-[11px] text-slate-400">
                              {formatDate(
                                activity.createdAt
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* Show All / Show Less */}
          {canShowAll && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:px-6">
              <button
                type="button"
                onClick={handleShowAll}
                disabled={loadingAll}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAll ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
                    Loading history...
                  </>
                ) : showAll ? (
                  <>
                    Show Less
                    <span className="text-base">
                      ↑
                    </span>
                  </>
                ) : (
                  <>
                    Show All
                    <span className="text-base">
                      ↓
                    </span>
                  </>
                )}
              </button>

              <p className="mt-2 text-center text-[11px] text-slate-400">
                {showAll
                  ? `Showing all ${activities.length} available activities`
                  : `Showing the latest ${visibleLimit} activities`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}