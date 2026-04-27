import { useMemo, useState } from "react";
import { Plus, Music, FolderOpen, Disc, X } from "lucide-react";
import { ShareEntityModal } from "./ShareEntityModal";

export const MessageComposer = ({
  onSend,
  blockedState,
  isSending,
  errorMessage,
  onAttachTrackOrPlaylist,
}) => {
  const [text, setText] = useState("");
  const [attachedEntity, setAttachedEntity] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const blockedMessage = useMemo(() => {
    if (blockedState === "i_blocked_them") {
      return "You blocked this user. Unblock to send messages or tracks.";
    }

    if (blockedState === "they_blocked_me") {
      return "This user blocked you. You cannot send messages or tracks.";
    }

    return "";
  }, [blockedState]);

  const canSend = !blockedMessage && !isSending;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSend) return;

    const trimmed = text.trim();
    if (!trimmed && !attachedEntity) return;

    const success = await onSend({
      text: trimmed,
      sharedEntity: attachedEntity,
    });
    if (success) {
      setText("");
      setAttachedEntity(null);
    }
  };

  const handleAttachClick = () => {
    if (!canSend) return;
    setIsShareModalOpen(true);
  };

  const handleSelectEntity = (entity) => {
    setAttachedEntity(entity);
    setIsShareModalOpen(false);
  };

  const handleRemoveAttached = () => {
    setAttachedEntity(null);
  };

  const getAttachedIcon = () => {
    const type = String(attachedEntity?.type ?? "").toLowerCase();
    if (type === "track") return <Music size={16} />;
    if (type === "playlist") return <FolderOpen size={16} />;
    return <Disc size={16} />;
  };

  return (
    <>
      <form className="messages-composer" onSubmit={handleSubmit}>
        {attachedEntity && (
          <div className="messages-composer-attached">
            <div className="messages-composer-attached-icon">
              {getAttachedIcon()}
            </div>
            <div className="messages-composer-attached-info">
              <div className="messages-composer-attached-title">
                {attachedEntity.title}
              </div>
              <div className="messages-composer-attached-type">
                {attachedEntity.type}
                {attachedEntity.artist && ` • ${attachedEntity.artist}`}
              </div>
            </div>
            <button
              type="button"
              className="messages-composer-attached-remove"
              onClick={handleRemoveAttached}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <label className="messages-composer-label">
          Write your message and add tracks or playlists <span>*</span>
        </label>

        <textarea
          placeholder={blockedMessage || "Write a message"}
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={!canSend}
          rows={attachedEntity ? 3 : 6}
        />

        <div className="messages-composer-actions">
          <button
            type="button"
            className="messages-secondary-btn"
            onClick={handleAttachClick}
            disabled={!canSend}
          >
            <Plus size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
            Add
          </button>

          <button
            type="submit"
            className="messages-primary-btn"
            disabled={!canSend || (!text.trim() && !attachedEntity)}
          >
            {isSending ? "Sending" : "Send"}
          </button>
        </div>

        {blockedMessage ? (
          <p className="messages-composer-note messages-composer-note-error">
            {blockedMessage}
          </p>
        ) : null}

        {!blockedMessage && errorMessage ? (
          <p className="messages-composer-note messages-composer-note-error">
            {errorMessage}
          </p>
        ) : null}
      </form>

      <ShareEntityModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSelect={handleSelectEntity}
      />
    </>
  );
};
