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
  const now = new Date();
  const diffHours = Math.round(
    (then.getTime() - now.getTime()) / (1000 * 60 * 60),
  );

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

function Comments({
  comments,
  totalCount = comments.length,
  onDeleteComment,
  onEditComment,
  onJumpToTime,
  onLoadReplies,
  onMessage,
  mode = "overview",
}) {
  const [sortOrder, setSortOrder] = useState(
    mode === "page" ? "newest" : "timeline",
  );
  const [expandedCommentIds, setExpandedCommentIds] = useState({});
  const [loadingReplyIds, setLoadingReplyIds] = useState({});
  const [loadedReplies, setLoadedReplies] = useState({});
  const [deletingCommentIds, setDeletingCommentIds] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEditId, setSavingEditId] = useState(null);

  const sortedComments = useMemo(() => {
    const nextComments = [...comments];

    if (sortOrder === "newest") {
      return nextComments.sort(
        (left, right) => new Date(right.created_at) - new Date(left.created_at),
      );
    }

    return nextComments.sort((left, right) => {
      const leftTime = left.timestamp_ms ?? Number.MAX_SAFE_INTEGER;
      const rightTime = right.timestamp_ms ?? Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    });
  }, [comments, sortOrder]);

  const toggleReplies = async (comment) => {
    const isExpanded = Boolean(expandedCommentIds[comment.id]);

    if (isExpanded) {
      setExpandedCommentIds((current) => ({
        ...current,
        [comment.id]: false,
      }));
      return;
    }

    if (!loadedReplies[comment.id] && onLoadReplies) {
      setLoadingReplyIds((current) => ({
        ...current,
        [comment.id]: true,
      }));

      try {
        const replies = await onLoadReplies(comment.id);
        setLoadedReplies((current) => ({
          ...current,
          [comment.id]: replies ?? [],
        }));
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

  const handleDelete = async (commentId, parentCommentId = null) => {
    setDeletingCommentIds((current) => ({
      ...current,
      [commentId]: true,
    }));

    try {
      await onDeleteComment?.(commentId);

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

  const startEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  const submitEdit = async (commentId) => {
    const trimmed = editText.trim();
    if (!trimmed) return;

    setSavingEditId(commentId);
    try {
      await onEditComment?.(commentId, trimmed);
      setEditingCommentId(null);
      setEditText("");
    } catch (error) {
      onMessage?.(error?.message || "Could not save edit.");
    } finally {
      setSavingEditId(null);
    }
  };

  const renderComment = (comment, options = {}) => {
    const { isReply = false, parentCommentId = null } = options;
    const replies = loadedReplies[comment.id] ?? [];
    const isExpanded = Boolean(expandedCommentIds[comment.id]);
    const isLoadingReplies = Boolean(loadingReplyIds[comment.id]);
    const isDeleting = Boolean(deletingCommentIds[comment.id]);
    const canOpenReplies = !isReply && Boolean(onLoadReplies);
    const replyButtonLabel = isExpanded
      ? "Hide replies"
      : `Replies (${comment.repliesCount ?? 0})`;

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
              {typeof comment.timestamp_ms === "number" ? (
                <button
                  className="comment-link"
                  type="button"
                  onClick={() => onJumpToTime(comment.timestamp_ms / 1000)}
                >
                  Jump to {formatTime(comment.timestamp_ms / 1000)}
                </button>
              ) : null}
              {comment.isOwnedByViewer &&
              !comment.isDeleted &&
              onEditComment ? (
                <button
                  className="comment-link"
                  type="button"
                  onClick={() => startEdit(comment)}
                >
                  Edit
                </button>
              ) : null}
              {comment.isOwnedByViewer && !comment.isDeleted ? (
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

            {editingCommentId === comment.id ? (
              <div className="comment-edit-form">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="comment-edit-input"
                />
                <button
                  className="comment-submit"
                  type="button"
                  onClick={() => submitEdit(comment.id)}
                  disabled={savingEditId === comment.id}
                >
                  {savingEditId === comment.id ? "Saving..." : "Save"}
                </button>
                <button
                  className="comment-link"
                  type="button"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
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
        {sortedComments.map((comment) => renderComment(comment))}
      </div>
    </section>
  );
}

export default Comments;
