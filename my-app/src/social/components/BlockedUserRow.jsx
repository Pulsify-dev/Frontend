import { useState } from "react";

export default function BlockedUserRow({ user, onUnblock, onEditReason }) {
  const [isUnblocking, setIsUnblocking] = useState(false);

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  async function handleUnblock() {
    setIsUnblocking(true);
    try {
      await onUnblock(user.id);
    } catch {
      setIsUnblocking(false);
    }
  }

  return (
    <div className="sc-blocked-row">
      <div className="sc-blocked-row__avatar-wrap">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="sc-blocked-row__avatar"
          />
        ) : (
          <div className="sc-blocked-row__avatar-placeholder">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#555">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
        )}
      </div>

      <div className="sc-blocked-row__info">
        <span className="sc-blocked-row__name">{user.displayName}</span>
        <span className="sc-blocked-row__username">@{user.username}</span>
        {user.reason && (
          <span className="sc-blocked-row__reason">
            Reason: {user.reason}
          </span>
        )}
      </div>

      <div className="sc-blocked-row__meta">
        {user.blockedAt && (
          <span className="sc-blocked-row__date">
            Blocked {formatDate(user.blockedAt)}
          </span>
        )}
      </div>

      <div className="sc-blocked-row__actions">
        <button
          className="sc-blocked-row__edit-btn"
          onClick={() => onEditReason(user)}
          title="Edit reason"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        </button>
        <button
          className="sc-blocked-row__unblock-btn"
          onClick={handleUnblock}
          disabled={isUnblocking}
        >
          {isUnblocking ? "Unblocking..." : "Unblock"}
        </button>
      </div>
    </div>
  );
}
