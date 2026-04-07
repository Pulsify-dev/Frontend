const TrackModal = ({ track, onClose, onHide, onUnhide, onRemove }) => {
  if (!track) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Track Details</h2>
          <button className="admin-modal-close" onClick={onClose}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="admin-modal-body">
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
            <img
              src={
                track.artworkUrl ||
                "https://i1.sndcdn.com/artworks-default.jpg"
              }
              alt={track.title}
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "8px",
                objectFit: "cover",
              }}
            />
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  color: "var(--sc-title)",
                  fontSize: "20px",
                  marginBottom: "8px",
                }}
              >
                {track.title}
              </h3>
              <p style={{ color: "var(--sc-muted)", marginBottom: "12px" }}>
                {track.artist}
              </p>
              <span
                className={`admin-badge admin-badge--${track.status}`}
                style={{ textTransform: "capitalize" }}
              >
                {track.status}
              </span>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Genre</label>
            <p style={{ color: "var(--sc-text)" }}>{track.genre || "N/A"}</p>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Duration</label>
            <p style={{ color: "var(--sc-text)" }}>{track.duration || "N/A"}</p>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Total Plays</label>
            <p style={{ color: "var(--sc-text)" }}>
              {track.plays?.toLocaleString() || 0}
            </p>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Likes</label>
            <p style={{ color: "var(--sc-text)" }}>
              {track.likes?.toLocaleString() || 0}
            </p>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Reports</label>
            <p style={{ color: "var(--sc-text)" }}>
              {track.reportsCount || 0}
            </p>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Uploaded</label>
            <p style={{ color: "var(--sc-text)" }}>
              {track.createdAt
                ? new Date(track.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn--secondary" onClick={onClose}>
            Close
          </button>
          {track.status === "active" ? (
            <button
              className="admin-btn admin-btn--hide"
              onClick={() => onHide(track.id)}
            >
              Hide Track
            </button>
          ) : track.status === "hidden" ? (
            <button
              className="admin-btn admin-btn--success"
              onClick={() => onUnhide(track.id)}
            >
              Unhide Track
            </button>
          ) : null}
          <button
            className="admin-btn admin-btn--danger"
            onClick={() => onRemove(track.id)}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackModal;
