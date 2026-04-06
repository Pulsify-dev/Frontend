import { useState, useEffect } from "react";

export default function BlockModal({ isOpen, onClose, onConfirm, user, mode = "block", initialReason = "" }) {
  const [reason, setReason] = useState(initialReason);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason(initialReason);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, initialReason]);

  if (!isOpen) return null;

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await onConfirm(user?.id, reason);
      handleClose();
    } catch (err) {
      console.error("Block action failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setIsAnimating(false);
    setTimeout(() => onClose(), 300);
  }

  const isEditMode = mode === "edit";
  const title = isEditMode ? "Edit Block Reason" : `Block ${user?.displayName || "User"}?`;
  const confirmText = isEditMode ? "Update Reason" : "Block User";

  return (
    <div
      className={`sc-overlay ${isAnimating ? "overlay--in" : "overlay--out"}`}
      onClick={handleClose}
    >
      <div
        className={`sc-block-modal ${isAnimating ? "modal--in" : "modal--out"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="sc-modal-close" onClick={handleClose}>✕</button>

        <div className="sc-block-modal__content">
          {!isEditMode && (
            <div className="sc-block-modal__icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#f44">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9A7.902 7.902 0 014 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1A7.902 7.902 0 0120 12c0 4.42-3.58 8-8 8z" />
              </svg>
            </div>
          )}

          <h3 className="sc-block-modal__title">{title}</h3>

          {!isEditMode && (
            <p className="sc-block-modal__desc">
              They won't be able to follow you or view your profile. Any existing follow relationships will be removed.
            </p>
          )}

          <div className="sc-block-modal__field">
            <label className="sc-edit-label" htmlFor="block-reason">
              Reason {isEditMode ? "" : "(optional)"}
            </label>
            <textarea
              id="block-reason"
              className="sc-edit-input sc-edit-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you blocking this user?"
              maxLength={500}
              rows={3}
            />
            <span className="sc-block-modal__charcount">{reason.length}/500</span>
          </div>

          <div className="sc-block-modal__actions">
            <button className="sc-cancel-btn" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              className={`sc-block-modal__confirm ${isEditMode ? "sc-save-btn" : ""}`}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
