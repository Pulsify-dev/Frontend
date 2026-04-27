import { useEffect, useRef, useState } from "react";
import SharedEntityCard from "@/messages/components/SharedEntityCard";
import { MessageComposer } from "@/messages/components/MessageComposer";
import { useMessaging } from "@/hooks/useMessaging";
import { AlertTriangle, User } from "lucide-react";

const formatMessageTime = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSeconds < 60) return "Just now";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const MessageThread = ({
  conversation,
  messages,
  currentUserId,
  blockedState,
  onSendMessage,
  sendingError,
  isLoading,
}) => {
  const { blockUser, unblockUser } = useMessaging();
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);
  const threadBodyRef = useRef(null);

  const participant = conversation?.otherParticipant ?? {};
  const currentBlockedState = blockedState || "none";
  const isUserBlockedByMe = currentBlockedState === "i_blocked_them";
  const isUserBlockedByThem = currentBlockedState === "they_blocked_me";

  const handleBlockClick = () => {
    if (isUserBlockedByMe) {
      handleUnblockConfirm();
    } else if (!isUserBlockedByThem) {
      setShowBlockModal(true);
    }
  };

  const handleUnblockConfirm = async () => {
    if (!participant.id || isBlocking) return;
    setIsBlocking(true);
    try {
      await unblockUser(participant.id);
    } catch (err) {
      console.error("Failed to unblock user:", err);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleBlockConfirm = async () => {
    if (!participant.id || isBlocking) return;
    setIsBlocking(true);
    try {
      await blockUser(participant.id, blockReason);
      setShowBlockModal(false);
    } catch (err) {
      console.error("Failed to block user:", err);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleBlockCancel = () => {
    setShowBlockModal(false);
    setBlockReason("");
  };

  useEffect(() => {
    if (!conversation || !threadBodyRef.current) return;
    threadBodyRef.current.scrollTop = threadBodyRef.current.scrollHeight;
  }, [conversation?.id, messages.length, isLoading]);

  return (
    <section className="messages-thread-shell">
      <header className="messages-thread-top">
        <div className="messages-thread-top-left">
          {conversation ? (
            <>
              {participant.avatarUrl ? (
                <img
                  className="messages-thread-avatar"
                  src={participant.avatarUrl}
                  alt={`${participant.displayName || participant.username || "User"} avatar`}
                />
              ) : (
                <div className="messages-thread-avatar messages-thread-avatar-default">
                  <User size={14} />
                </div>
              )}

              <h3 className="messages-thread-title">
                {participant.displayName || participant.username || "Unknown user"}
              </h3>
            </>
          ) : null}
        </div>

        {conversation ? (
          <div className="messages-thread-top-right">
            {isUserBlockedByMe ? (
              <button type="button" className="messages-text-action" onClick={handleBlockClick}>
                Unblock
              </button>
            ) : isUserBlockedByThem ? null : (
              <button type="button" className="messages-text-action" onClick={handleBlockClick}>
                Block
              </button>
            )}
          </div>
        ) : null}
      </header>

      {!conversation ? (
        <div className="messages-thread-empty">
          <h3>You have no messages</h3>
          <p>Send someone a message and make their day.</p>
        </div>
      ) : (
        <>
          <div className="messages-thread-body" ref={threadBodyRef}>
            {isLoading ? (
              <div className="messages-thread-state">
                <span className="messages-loading-spinner" />
                <span>Loading chat history...</span>
              </div>
            ) : messages.length ? (
              messages.map((message) => {
                const isMine = String(message.senderId ?? "") === String(currentUserId ?? "");

                return (
                  <article
                    key={message.id || message.clientNonce}
                    className={`messages-bubble-row${isMine ? " is-mine" : ""}`}
                  >
                    <div className={`messages-bubble${isMine ? " is-mine" : ""}`}>
                      {message.text ? <p>{message.text}</p> : null}

                      {message.sharedEntity ? (
                        <SharedEntityCard sharedEntity={message.sharedEntity} />
                      ) : null}

                      <div className="messages-bubble-footer">
                        <div className="messages-bubble-meta">
                          <span>{formatMessageTime(message.createdAt)}</span>
                        </div>
                        {isMine && message.deliveryState === "failed" ? (
                          <span className="messages-bubble-error">Failed</span>
                        ) : null}
                        {isMine && message.deliveryState === "sending" ? <span>Sending...</span> : null}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="messages-thread-state">No messages yet.</div>
            )}
          </div>

          <MessageComposer
            blockedState={blockedState}
            onSend={onSendMessage}
            isSending={false}
            errorMessage={sendingError}
          />
        </>
      )}

      {showBlockModal && (
        <div className="messages-modal-overlay" onClick={handleBlockCancel}>
          <div className="messages-block-modal" onClick={(e) => e.stopPropagation()}>
            <div className="messages-block-modal-icon">
              <AlertTriangle size={24} />
            </div>
            <h3 className="messages-block-modal-title">
              Block {participant.displayName || participant.username || "this user"}?
            </h3>
            <p className="messages-block-modal-text">
              They won't be able to view your profile, follow you, or send you messages.
            </p>
            <div className="messages-block-modal-reason">
              <label className="messages-block-modal-label">Reason (optional)</label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Why are you blocking this user?"
                maxLength={500}
                rows={3}
              />
            </div>
            <div className="messages-block-modal-actions">
              <button
                type="button"
                className="messages-block-modal-cancel"
                onClick={handleBlockCancel}
                disabled={isBlocking}
              >
                Cancel
              </button>
              <button
                type="button"
                className="messages-block-modal-confirm"
                onClick={handleBlockConfirm}
                disabled={isBlocking}
              >
                {isBlocking ? "Blocking..." : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
