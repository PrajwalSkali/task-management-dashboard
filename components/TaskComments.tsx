"use client";

import { useEffect, useState } from "react";

type CommentUser = {
  id: string;
  name: string;
  email: string;
};

type Comment = {
  id: string;
  taskId: string;
  content: string;
  user: CommentUser | null;
  createdAt: string;
  updatedAt: string;
  canEdit?: boolean;
  canDelete?: boolean;
};

type TaskCommentsProps = {
  taskId: string;
};

const MAX_COMMENT_LENGTH = 1000;

export default function TaskComments({
  taskId,
}: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(
    []
  );

  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editingContent, setEditingContent] =
    useState("");

  const [updating, setUpdating] = useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  // ==========================================
  // LOAD COMMENTS
  // ==========================================

  const loadComments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/comments?taskId=${encodeURIComponent(
          taskId
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to fetch comments"
        );
      }

      setComments(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to load comments:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load comments."
      );

      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setComments([]);
    setContent("");
    setEditingId(null);
    setEditingContent("");
    setError("");

    loadComments();
  }, [taskId]);

  // ==========================================
  // ADD COMMENT
  // ==========================================

  const handleAddComment = async () => {
    const trimmedContent =
      content.trim();

    if (!trimmedContent) {
      return;
    }

    if (
      trimmedContent.length >
      MAX_COMMENT_LENGTH
    ) {
      setError(
        `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(
        "/api/comments",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            taskId,
            content: trimmedContent,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to add comment"
        );
      }

      setComments((current) => [
        ...current,
        data,
      ]);

      setContent("");
    } catch (error) {
      console.error(
        "Failed to add comment:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to add comment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // START EDITING
  // ==========================================

  const handleStartEdit = (
    comment: Comment
  ) => {
    if (!comment.canEdit) {
      return;
    }

    setError("");
    setEditingId(comment.id);
    setEditingContent(
      comment.content
    );
  };

  // ==========================================
  // CANCEL EDITING
  // ==========================================

  const handleCancelEdit = () => {
    if (updating) {
      return;
    }

    setEditingId(null);
    setEditingContent("");
  };

  // ==========================================
  // UPDATE COMMENT
  // ==========================================

  const handleUpdateComment =
    async () => {
      if (!editingId || updating) {
        return;
      }

      const trimmedContent =
        editingContent.trim();

      if (!trimmedContent) {
        setError(
          "Comment cannot be empty."
        );
        return;
      }

      if (
        trimmedContent.length >
        MAX_COMMENT_LENGTH
      ) {
        setError(
          `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`
        );
        return;
      }

      try {
        setUpdating(true);
        setError("");

        const response = await fetch(
          `/api/comments/${editingId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              content:
                trimmedContent,
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to update comment"
          );
        }

        setComments((current) =>
          current.map(
            (comment) =>
              comment.id ===
              editingId
                ? {
                    ...comment,
                    content:
                      data.content,
                    updatedAt:
                      data.updatedAt ??
                      comment.updatedAt,
                  }
                : comment
          )
        );

        setEditingId(null);
        setEditingContent("");
      } catch (error) {
        console.error(
          "Failed to update comment:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to update comment."
        );
      } finally {
        setUpdating(false);
      }
    };

  // ==========================================
  // DELETE COMMENT
  // ==========================================

  const handleDeleteComment = async (
    comment: Comment
  ) => {
    if (
      !comment.canDelete ||
      deletingId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this comment?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(comment.id);
      setError("");

      const response = await fetch(
        `/api/comments/${comment.id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete comment"
        );
      }

      setComments((current) =>
        current.filter(
          (currentComment) =>
            currentComment.id !==
            comment.id
        )
      );

      if (
        editingId === comment.id
      ) {
        setEditingId(null);
        setEditingContent("");
      }
    } catch (error) {
      console.error(
        "Failed to delete comment:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete comment."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (
    date: string
  ) => {
    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "";
    }

    return parsedDate.toLocaleString();
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-5">

        <div className="flex items-center justify-between gap-3">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-base text-blue-600">
              💬
            </div>

            <div className="min-w-0">
              <h4 className="font-bold text-slate-800">
                Comments
              </h4>

              <p className="mt-0.5 text-xs text-slate-400">
                Discuss this task with your team
              </p>
            </div>

          </div>

          <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {comments.length}{" "}
            {comments.length === 1
              ? "comment"
              : "comments"}
          </span>

        </div>
      </div>

      {/* ======================================
          CONTENT
      ====================================== */}

      <div className="p-4 sm:p-5">

        {/* Error */}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-600">
            <span className="shrink-0">
              ⚠
            </span>

            <span className="break-words">
              {error}
            </span>
          </div>
        )}

        {/* ====================================
            ADD COMMENT
        ==================================== */}

        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">

          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Add a comment
            </span>
          </div>

          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);

              if (error) {
                setError("");
              }
            }}
            placeholder="Write a comment..."
            maxLength={
              MAX_COMMENT_LENGTH
            }
            rows={3}
            disabled={submitting}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
          />

          <div className="mt-2.5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">

            <span className="text-xs text-slate-400">
              {content.length}/
              {MAX_COMMENT_LENGTH}
            </span>

            <button
              type="button"
              onClick={
                handleAddComment
              }
              disabled={
                submitting ||
                !content.trim()
              }
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {submitting
                ? "Adding..."
                : "Add Comment"}
            </button>

          </div>
        </div>

        {/* ====================================
            COMMENTS LIST
        ==================================== */}

        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center">

            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-3 border-slate-200 border-t-blue-600" />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading comments...
            </p>

          </div>
        ) : comments.length ===
          0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-400">
              💬
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-600">
              No comments yet
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Be the first to add a comment.
            </p>

          </div>
        ) : (
          <div className="space-y-3">

            {comments.map(
              (comment) => {
                const isEditing =
                  editingId ===
                  comment.id;

                const isDeleting =
                  deletingId ===
                  comment.id;

                const userInitial =
                  (
                    comment.user
                      ?.name ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase();

                return (
                  <div
                    key={comment.id}
                    className={`rounded-xl border bg-white p-4 shadow-sm transition ${
                      isEditing
                        ? "border-blue-200 ring-2 ring-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >

                    {/* Comment Header */}

                    <div className="flex min-w-0 items-start justify-between gap-3">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                          {userInitial}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-bold text-slate-800">
                            {comment.user
                              ?.name ??
                              "Unknown User"}
                          </p>

                          <p className="mt-0.5 truncate text-[11px] text-slate-400">
                            {formatDate(
                              comment.createdAt
                            )}

                            {comment.updatedAt !==
                              comment.createdAt && (
                              <span>
                                {" "}
                                · Edited
                              </span>
                            )}
                          </p>

                        </div>
                      </div>

                      {/* Permission-based Actions */}

                      <div className="flex shrink-0 items-center gap-1.5">

                        {!isEditing &&
                          comment.canEdit && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStartEdit(
                                  comment
                                )
                              }
                              disabled={
                                Boolean(
                                  deletingId
                                )
                              }
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                            >
                              Edit
                            </button>
                          )}

                        {!isEditing &&
                          comment.canDelete && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteComment(
                                  comment
                                )
                              }
                              disabled={
                                Boolean(
                                  deletingId
                                )
                              }
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                            >
                              {isDeleting
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          )}

                      </div>
                    </div>

                    {/* ==================================
                        EDITING
                    ================================== */}

                    {isEditing ? (
                      <div className="mt-4">

                        <textarea
                          value={
                            editingContent
                          }
                          onChange={(e) => {
                            setEditingContent(
                              e.target.value
                            );

                            if (error) {
                              setError("");
                            }
                          }}
                          maxLength={
                            MAX_COMMENT_LENGTH
                          }
                          rows={3}
                          disabled={updating}
                          className="w-full resize-none rounded-xl border border-blue-200 bg-blue-50/40 px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                        />

                        <div className="mt-2.5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">

                          <span className="text-xs text-slate-400">
                            {
                              editingContent.length
                            }
                            /
                            {
                              MAX_COMMENT_LENGTH
                            }
                          </span>

                          <div className="flex w-full gap-2 sm:w-auto">

                            <button
                              type="button"
                              onClick={
                                handleCancelEdit
                              }
                              disabled={
                                updating
                              }
                              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              onClick={
                                handleUpdateComment
                              }
                              disabled={
                                updating ||
                                !editingContent.trim()
                              }
                              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                            >
                              {updating
                                ? "Saving..."
                                : "Save"}
                            </button>

                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-700">
                        {comment.content}
                      </p>
                    )}

                  </div>
                );
              }
            )}

          </div>
        )}
      </div>
    </div>
  );
}