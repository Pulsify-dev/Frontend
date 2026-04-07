const UserModal = ({ user, onClose, onSuspend, onUnsuspend }) => {
  if (!user) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">User Details</h2>
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <img
              src={user.avatarUrl || "https://i1.sndcdn.com/avatars-default.jpg"}
              alt={user.username}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <div>
              <h3 style={{ color: "var(--sc-title)", marginBottom: "4px" }}>
                {user.username}
              </h3>
              <p style={{ color: "var(--sc-muted)", fontSize: "14px" }}>
                {user.email}
              </p>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Status</label>
            <span
              className={`admin-badge admin-badge--${user.status}`}
              style={{ textTransform: "capitalize" }}
            >
              {user.status === "active" ? "Active" : "Suspended"}
            </span>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Role</label>
            <span
              className={`admin-badge admin-badge--${user.role?.toLowerCase()}`}
              style={{ textTransform: "capitalize" }}
            >
              {user.role}
            </span>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Member Since</label>
            <p style={{ color: "var(--sc-text)" }}>
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Total Tracks</label>
            <p style={{ color: "var(--sc-text)" }}>{user.totalTracks || 0}</p>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Total Plays</label>
            <p style={{ color: "var(--sc-text)" }}>
              {user.totalPlays?.toLocaleString() || 0}
            </p>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Reports Against</label>
            <p style={{ color: "var(--sc-text)" }}>
              {user.reportsCount || 0}
            </p>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn--secondary" onClick={onClose}>
            Close
          </button>
          {user.status === "active" ? (
            <button
              className="admin-btn admin-btn--danger"
              onClick={() => onSuspend(user.id)}
            >
              Suspend User
            </button>
          ) : (
            <button
              className="admin-btn admin-btn--success"
              onClick={() => onUnsuspend(user.id)}
            >
              Unsuspend User
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserModal;
