import { useMemo, useState } from "react";

const getInitialDataUri = (name) => {
  const letter = (name ?? "?")[0].toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><rect width="44" height="44" rx="22" fill="%23ff5500"/><text x="22" y="29" text-anchor="middle" font-size="18" font-weight="700" font-family="sans-serif" fill="%23fff">${letter}</text></svg>`;
  return `data:image/svg+xml,${svg}`;
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatRelativeDate = (value) => {
  const then = new Date(value);
  const timestamp = then.getTime();

  if (Number.isNaN(timestamp)) {
    return "just now";
  }

  const now = new Date();
  const diffHours = Math.round((timestamp - now.getTime()) / (1000 * 60 * 60));

  if (Math.abs(diffHours) < 24) {
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
      diffHours,
      "hour",
    );
  }

  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round(diffHours / 24),
    "day",
  );
};

const markReplyAsDeleted = (reply) => ({
  ...reply,
  text: "Comment deleted.",
  isDeleted: true,
});

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object, key);

const mergeById = (items) => {
  const itemMap = new Map();

  items.forEach((item) => {
    if (item?.id) {
      itemMap.set(item.id, item);
    }
  });

  return [...itemMap.values()];
};

const getCommentCreatedAtMs = (comment) => {
  const createdAtMs = new Date(comment?.created_at).getTime();
  return Number.isNaN(createdAtMs) ? 0 : createdAtMs;
};

const getCommentTimelineMs = (comment) =>
  typeof comment?.timestamp_ms === "number"
    ? comment.timestamp_ms
    : Number.MAX_SAFE_INTEGER;

const sortComments = (items, sortOrder) =>
  [...items].sort((left, right) => {
    if (sortOrder === "newest") {
      const createdAtDifference =
        getCommentCreatedAtMs(right) - getCommentCreatedAtMs(left);

      if (createdAtDifference !== 0) return createdAtDifference;

      return getCommentTimelineMs(left) - getCommentTimelineMs(right);
    }

    const leftHasTimeline = typeof left?.timestamp_ms === "number";
    const rightHasTimeline = typeof right?.timestamp_ms === "number";

    if (leftHasTimeline && rightHasTimeline) {
      const timelineDifference = left.timestamp_ms - right.timestamp_ms;
      if (timelineDifference !== 0) return timelineDifference;
    } else if (leftHasTimeline !== rightHasTimeline) {
      return leftHasTimeline ? -1 : 1;
    }

    return getCommentCreatedAtMs(right) - getCommentCreatedAtMs(left);
  });

const normalizeRepliesPayload = (payload) => {
  if (Array.isArray(payload)) {
    return {
      replies: payload,
      totalCount: payload.length,
      pagination: {
        page: 1,
        limit: payload.length || 20,
        total: payload.length,
        pages: 1,
      },
    };
  }

  return {
    replies: payload?.replies ?? [],
    totalCount: payload?.totalCount ?? payload?.replies?.length ?? 0,
    pagination: payload?.pagination ?? {
      page: 1,
      limit: payload?.replies?.length || 20,
      total: payload?.totalCount ?? payload?.replies?.length ?? 0,
      pages: 1,
    },
  };
};

function Comments({
  comments,
  totalCount = comments.length,
  onDeleteComment,
  onEditComment,
  onJumpToTime,
  onLoadReplies,
  onReplySubmit,
  onUpdateComment,
  onLoadMoreComments,
  hasMoreComments = false,
  isLoadingMoreComments = false,
  onMessage,
  mode = "overview",
}) {
  const [sortOrder, setSortOrder] = useState(
    mode === "page" ? "newest" : "timeline",
  );
  const [expandedCommentIds, setExpandedCommentIds] = useState({});
  const [loadingReplyIds, setLoadingReplyIds] = useState({});
  const [loadingMoreReplyIds, setLoadingMoreReplyIds] = useState({});
  const [loadedReplies, setLoadedReplies] = useState({});
  const [replyPagination, setReplyPagination] = useState({});
  const [deletingCommentIds, setDeletingCommentIds] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyErrors, setReplyErrors] = useState({});
  const [replyComposerIds, setReplyComposerIds] = useState({});
  const [submittingReplyIds, setSubmittingReplyIds] = useState({});
  const [editingCommentIds, setEditingCommentIds] = useState({});
  const [editDrafts, setEditDrafts] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [savingEditIds, setSavingEditIds] = useState({});

  const sortedComments = useMemo(
    () => sortComments(comments, sortOrder),
    [comments, sortOrder],
  );

  const storeRepliesPayload = (commentId, payload, strategy = "replace") => {
    const normalizedPayload = normalizeRepliesPayload(payload);

    setLoadedReplies((current) => ({
      ...current,
      [commentId]:
        strategy === "append"
          ? mergeById([
              ...(current[commentId] ?? []),
              ...normalizedPayload.replies,
            ])
          : normalizedPayload.replies,
    }));
    setReplyPagination((current) => ({
      ...current,
      [commentId]: normalizedPayload.pagination,
    }));
  };

  const toggleReplies = async (comment) => {
    const isExpanded = Boolean(expandedCommentIds[comment.id]);

    if (isExpanded) {
      setExpandedCommentIds((current) => ({
        ...current,
        [comment.id]: false,
      }));
      return;
    }

    if (!hasOwn(loadedReplies, comment.id) && onLoadReplies) {
      setLoadingReplyIds((current) => ({
        ...current,
        [comment.id]: true,
      }));

      try {
        const payload = await onLoadReplies(comment.id, { page: 1, limit: 20 });
        storeRepliesPayload(comment.id, payload);
      } catch (error) {
        onMessage?.(error?.message || "Could not load replies right now.");
      } finally {
        setLoadingReplyIds((current) => ({
          ...current,
          [comment.id]: false,
        }));
      }
    }

    setExpandedCommentIds((current) => ({
      ...current,
      [comment.id]: true,
    }));
  };

  const handleLoadMoreReplies = async (comment) => {
    if (!onLoadReplies) return;

    const pagination = replyPagination[comment.id];
    const nextPage = (pagination?.page ?? 1) + 1;
    const totalPages = pagination?.pages ?? 1;

    if (nextPage > totalPages) return;

    setLoadingMoreReplyIds((current) => ({
      ...current,
      [comment.id]: true,
    }));

    try {
      const payload = await onLoadReplies(comment.id, {
        page: nextPage,
        limit: pagination?.limit ?? 20,
      });
      storeRepliesPayload(comment.id, payload, "append");
    } catch (error) {
      onMessage?.(error?.message || "Could not load more replies right now.");
    } finally {
      setLoadingMoreReplyIds((current) => ({
        ...current,
        [comment.id]: false,
      }));
    }
  };

  const handleDelete = async (commentId, parentCommentId = null) => {
    setDeletingCommentIds((current) => ({
      ...current,
      [commentId]: true,
    }));

    try {
      await onDeleteComment?.(commentId, { parentCommentId });

      if (parentCommentId) {
        setLoadedReplies((current) => ({
          ...current,
          [parentCommentId]: (current[parentCommentId] ?? []).map((reply) =>
            reply.id === commentId ? markReplyAsDeleted(reply) : reply,
          ),
        }));
      }
    } catch (error) {
      onMessage?.(error?.message || "Could not delete this comment.");
    } finally {
      setDeletingCommentIds((current) => ({
        ...current,
        [commentId]: false,
      }));
    }
  };

  const toggleReplyComposer = (commentId) => {
    setReplyComposerIds((current) => ({
      ...current,
      [commentId]: !current[commentId],
    }));
    setReplyErrors((current) => ({
      ...current,
      [commentId]: "",
    }));
  };

  const toggleEditComposer = (comment) => {
    const nextIsOpen = !editingCommentIds[comment.id];

    setEditingCommentIds((current) => ({
      ...current,
      [comment.id]: nextIsOpen,
    }));
    setEditDrafts((current) => ({
      ...current,
      [comment.id]: nextIsOpen
        ? (comment.text ?? "")
        : (current[comment.id] ?? ""),
    }));
    setEditErrors((current) => ({
      ...current,
      [comment.id]: "",
    }));
  };

  const handleReplySubmit = async (comment) => {
    const draft = String(replyDrafts[comment.id] ?? "").trim();

    if (!draft) {
      setReplyErrors((current) => ({
        ...current,
        [comment.id]: "Write a reply first.",
      }));
      return;
    }

    setSubmittingReplyIds((current) => ({
      ...current,
      [comment.id]: true,
    }));
    setReplyErrors((current) => ({
      ...current,
      [comment.id]: "",
    }));

    try {
      const reply = await onReplySubmit?.(comment.id, {
        text: draft,
        timestamp_ms: comment.timestamp_ms ?? 0,
      });
      if (!reply) return;

      setLoadedReplies((current) => ({
        ...current,
        [comment.id]: mergeById([...(current[comment.id] ?? []), reply]),
      }));
      setReplyPagination((current) => {
        const existing = current[comment.id] ?? {
          page: 1,
          limit: 20,
          total: 0,
          pages: 1,
        };
        const nextTotal = (existing.total ?? 0) + 1;

        return {
          ...current,
          [comment.id]: {
            ...existing,
            total: nextTotal,
            pages: Math.max(
              existing.pages ?? 1,
              Math.ceil(nextTotal / Math.max(existing.limit ?? 20, 1)),
            ),
          },
        };
      });
      setExpandedCommentIds((current) => ({
        ...current,
        [comment.id]: true,
      }));
      setReplyDrafts((current) => ({
        ...current,
        [comment.id]: "",
      }));
      setReplyComposerIds((current) => ({
        ...current,
        [comment.id]: false,
      }));
    } catch (error) {
      const message = error?.message || "Reply could not be posted.";
      setReplyErrors((current) => ({
        ...current,
        [comment.id]: message,
      }));
      onMessage?.(message);
    } finally {
      setSubmittingReplyIds((current) => ({
        ...current,
        [comment.id]: false,
      }));
    }
  };

  const handleEditSubmit = async (comment, parentCommentId = null) => {
    const draft = String(editDrafts[comment.id] ?? "").trim();

    if (!draft) {
      setEditErrors((current) => ({
        ...current,
        [comment.id]: "Write an updated comment first.",
      }));
      return;
    }

    setSavingEditIds((current) => ({
      ...current,
      [comment.id]: true,
    }));
    setEditErrors((current) => ({
      ...current,
      [comment.id]: "",
    }));

    try {
      const updatedComment = await onUpdateComment?.(comment.id, draft, {
        parentCommentId,
      });

      if (parentCommentId && updatedComment) {
        setLoadedReplies((current) => ({
          ...current,
          [parentCommentId]: (current[parentCommentId] ?? []).map((reply) =>
            reply.id === comment.id
              ? {
                  ...reply,
                  ...updatedComment,
                }
              : reply,
          ),
        }));
      }

      setEditingCommentIds((current) => ({
        ...current,
        [comment.id]: false,
      }));
    } catch (error) {
      const message = error?.message || "Comment could not be updated.";
      setEditErrors((current) => ({
        ...current,
        [comment.id]: message,
      }));
      onMessage?.(message);
    } finally {
      setSavingEditIds((current) => ({
        ...current,
        [comment.id]: false,
      }));
    }
  };

  const renderComment = (comment, options = {}) => {
    const { isReply = false, parentCommentId = null } = options;
    const replies = sortComments(loadedReplies[comment.id] ?? [], sortOrder);
    const pagination = replyPagination[comment.id];
    const isExpanded = Boolean(expandedCommentIds[comment.id]);
    const isLoadingReplies = Boolean(loadingReplyIds[comment.id]);
    const isLoadingMoreReplies = Boolean(loadingMoreReplyIds[comment.id]);
    const isDeleting = Boolean(deletingCommentIds[comment.id]);
    const isSubmittingReply = Boolean(submittingReplyIds[comment.id]);
    const isSavingEdit = Boolean(savingEditIds[comment.id]);
    const isReplyComposerOpen = Boolean(replyComposerIds[comment.id]);
    const isEditing = Boolean(editingCommentIds[comment.id]);
    const canOpenReplies = !isReply && Boolean(onLoadReplies);
    const canReply = !isReply && !comment.isDeleted && Boolean(onReplySubmit);
    const canEdit =
      Boolean(onUpdateComment) &&
      Boolean(comment.canEdit) &&
      !comment.isDeleted;
    const canDelete =
      Boolean(onDeleteComment) &&
      Boolean(comment.canDelete) &&
      !comment.isDeleted;
    const replyButtonLabel = isExpanded
      ? "Hide replies"
      : `Replies (${comment.repliesCount ?? 0})`;
    const hasMoreReplies =
      Boolean(pagination) &&
      ((pagination.page ?? 1) < (pagination.pages ?? 1) ||
        replies.length < (pagination.total ?? replies.length));

    return (
      <div
        className={`comment-block ${isReply ? "is-reply" : ""}`}
        key={comment.id}
      >
        <article className="comment-row">
          <img
            src={comment.user.avatar || getInitialDataUri(comment.user.name)}
            alt={comment.user.name}
            onError={(e) => {
              e.currentTarget.src = getInitialDataUri(comment.user.name);
            }}
          />
          <div className="comment-content">
            <div className="comment-meta">
              <strong>{comment.user.name}</strong>
              <span>
                {typeof comment.timestamp_ms === "number"
                  ? `at ${formatTime(comment.timestamp_ms / 1000)}`
                  : "general comment"}
              </span>
              {comment.isEdited ? <span>edited</span> : null}
              <span>{formatRelativeDate(comment.created_at)}</span>
            </div>

            <p>{comment.isDeleted ? "Comment deleted." : comment.text}</p>

            <div className="comment-actions">
              {canOpenReplies ? (
                <button
                  className="comment-link"
                  type="button"
                  onClick={() => toggleReplies(comment)}
                  disabled={isLoadingReplies}
                >
                  {isLoadingReplies ? "Loading replies..." : replyButtonLabel}
                </button>
              ) : null}
              {canReply ? (
                <button
                  className="comment-link"
                  type="button"
                  onClick={() => toggleReplyComposer(comment.id)}
                >
                  {isReplyComposerOpen ? "Cancel reply" : "Reply"}
                </button>
              ) : null}
              {canEdit ? (
                <button
                  className="comment-link"
                  type="button"
                  onClick={() => toggleEditComposer(comment)}
                >
                  {isEditing ? "Cancel edit" : "Edit"}
                </button>
              ) : null}
              {typeof comment.timestamp_ms === "number" ? (
                <button
                  className="comment-link"
                  type="button"
                  onClick={() => onJumpToTime(comment.timestamp_ms / 1000)}
                >
                  Jump to {formatTime(comment.timestamp_ms / 1000)}
                </button>
              ) : null}
              {canDelete ? (
                <button
                  className="comment-link comment-link-danger"
                  type="button"
                  onClick={() => handleDelete(comment.id, parentCommentId)}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              ) : null}
            </div>

            {canEdit && isEditing ? (
              <div className="reply-compose-shell">
                <div className="comment-form-inline">
                  <input
                    type="text"
                    value={editDrafts[comment.id] ?? ""}
                    onChange={(event) =>
                      setEditDrafts((current) => ({
                        ...current,
                        [comment.id]: event.target.value,
                      }))
                    }
                    placeholder="Edit your comment"
                  />
                  <button
                    className="comment-submit"
                    type="button"
                    onClick={() => handleEditSubmit(comment, parentCommentId)}
                    disabled={isSavingEdit}
                  >
                    {isSavingEdit ? "Saving" : "Save"}
                  </button>
                </div>
                {editErrors[comment.id] ? (
                  <p className="panel-notice panel-notice-error">
                    {editErrors[comment.id]}
                  </p>
                ) : null}
              </div>
            ) : null}

            {canReply && isReplyComposerOpen ? (
              <div className="reply-compose-shell">
                <div className="comment-form-inline">
                  <input
                    type="text"
                    value={replyDrafts[comment.id] ?? ""}
                    onChange={(event) =>
                      setReplyDrafts((current) => ({
                        ...current,
                        [comment.id]: event.target.value,
                      }))
                    }
                    placeholder={`Reply to ${comment.user.name}`}
                  />
                  <button
                    className="comment-submit"
                    type="button"
                    onClick={() => handleReplySubmit(comment)}
                    disabled={isSubmittingReply}
                  >
                    {isSubmittingReply ? "Sending" : "Reply"}
                  </button>
                </div>
                {replyErrors[comment.id] ? (
                  <p className="panel-notice panel-notice-error">
                    {replyErrors[comment.id]}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <button
            className="comment-count-pill"
            type="button"
            onClick={() =>
              canOpenReplies ? toggleReplies(comment) : undefined
            }
            disabled={!canOpenReplies}
          >
            {comment.repliesCount ?? 0}
          </button>
        </article>

        {canOpenReplies && isExpanded ? (
          <div className="reply-thread">
            {replies.length ? (
              replies.map((reply) =>
                renderComment(reply, {
                  isReply: true,
                  parentCommentId: comment.id,
                }),
              )
            ) : (
              <p className="reply-empty">No replies yet.</p>
            )}

            {hasMoreReplies ? (
              <button
                className="comment-load-more"
                type="button"
                onClick={() => handleLoadMoreReplies(comment)}
                disabled={isLoadingMoreReplies}
              >
                {isLoadingMoreReplies
                  ? "Loading more replies..."
                  : "Load more replies"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <section className={`comments-panel ${mode === "page" ? "is-page" : ""}`}>
      <div className="comments-panel-head">
        <h2>{totalCount} comments</h2>
        <label className="sort-select">
          <span>Sorted by:</span>
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="timeline">Timeline</option>
          </select>
        </label>
      </div>

      <div className="comment-thread">
        {sortedComments.length ? (
          sortedComments.map((comment) => renderComment(comment))
        ) : (
          <p className="comment-empty-state">No comments yet.</p>
        )}
      </div>

      {mode === "page" && hasMoreComments ? (
        <div className="comment-thread-footer">
          <button
            className="comment-load-more"
            type="button"
            onClick={onLoadMoreComments}
            disabled={isLoadingMoreComments}
          >
            {isLoadingMoreComments
              ? "Loading more comments..."
              : "Load more comments"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default Comments;
