import { Link } from "react-router-dom";
import { User } from "lucide-react";

const formatConversationTime = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return "Just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

export const ConversationListItem = ({ conversation, isActive, onOpen }) => {
  const unread = Number(conversation.unreadCount ?? 0);
  const participant = conversation.otherParticipant ?? {};
  const previewText =
    conversation.lastMessageText ||
    `@${participant.username || "listener"}`;
  const hasAvatar = participant.avatarUrl;

  return (
    <Link
      to={`/messages/${conversation.id}`}
      className={`messages-conversation-item${isActive ? " is-active" : ""}`}
      onClick={() => onOpen(conversation.id)}
    >
      {hasAvatar ? (
        <img
          className="messages-conversation-avatar"
          src={participant.avatarUrl}
          alt={participant.displayName || "User avatar"}
        />
      ) : (
        <div className="messages-conversation-avatar messages-conversation-avatar-default">
          <User size={18} />
        </div>
      )}

      <div className="messages-conversation-content">
        <div className="messages-conversation-head">
          <strong>{participant.displayName || participant.username || "Unknown user"}</strong>
          <span>{formatConversationTime(conversation.lastMessageAt)}</span>
        </div>
        <div className="messages-conversation-meta">{previewText}</div>
      </div>

      {unread > 0 ? (
        <span className="messages-conversation-unread">{unread > 99 ? "99+" : unread}</span>
      ) : null}
    </Link>
  );
};
