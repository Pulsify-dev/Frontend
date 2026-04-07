const ReportModal = ({ report, onClose, onResolve, onDismiss }) => {
  if (!report) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Report Details</h2>
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
          <div className="admin-form-group">
            <label className="admin-form-label">Report Type</label>
            <span
              className={`admin-badge admin-badge--${report.type}`}
              style={{ textTransform: "capitalize" }}
            >
              {report.type}
            </span>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Status</label>
            <span
              className={`admin-badge admin-badge--${report.status}`}
              style={{ textTransform: "capitalize" }}
            >
              {report.status}
            </span>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Reporter</label>
            <div className="admin-table-user">
              <img
                src={
                  report.reporter?.avatarUrl ||
                  "https://i1.sndcdn.com/avatars-default.jpg"
                }
                alt={report.reporter?.username}
                className="admin-table-user-avatar"
              />
              <div className="admin-table-user-info">
                <div className="admin-table-user-name">
                  {report.reporter?.username}
                </div>
                <div className="admin-table-user-email">
                  {report.reporter?.email}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Reported Content</label>
            <div className="admin-report-content">
              <img
                src={
                  report.content?.artworkUrl ||
                  "https://i1.sndcdn.com/artworks-default.jpg"
                }
                alt={report.content?.title}
                className="admin-report-content-img"
              />
              <div className="admin-report-content-info">
                <div className="admin-report-content-title">
                  {report.content?.title}
                </div>
                <div className="admin-report-content-artist">
                  {report.content?.artist}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Reason</label>
            <p style={{ color: "var(--sc-text)", lineHeight: 1.6 }}>
              {report.reason}
            </p>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Submitted</label>
            <p style={{ color: "var(--sc-muted)" }}>
              {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn--secondary" onClick={onClose}>
            Close
          </button>
          {report.status === "pending" && (
            <>
              <button
                className="admin-btn admin-btn--danger"
                onClick={() => onDismiss(report.id)}
              >
                Dismiss
              </button>
              <button
                className="admin-btn admin-btn--success"
                onClick={() => onResolve(report.id)}
              >
                Resolve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
