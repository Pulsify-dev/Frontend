import { useState } from "react";

const ReportDialog = ({ track, onClose }) => {
  const [reportType, setReportType] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const reportTypes = [
    {
      value: "copyright",
      label: "Copyright Infringement",
      description: "This content uses copyrighted material without permission",
    },
    {
      value: "inappropriate",
      label: "Inappropriate Content",
      description: "This content contains offensive, explicit, or harmful material",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!reportType) {
      setError("Please select a report type");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for your report");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="admin-modal-overlay" onClick={onClose}>
        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
          <div className="admin-modal-header">
            <h2 className="admin-modal-title">Report Submitted</h2>
            <button className="admin-modal-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="admin-modal-body" style={{ textAlign: "center", padding: "40px 24px" }}>
            <div style={{ width: "64px", height: "64px", margin: "0 auto 24px", background: "rgba(34, 197, 94, 0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ color: "var(--sc-title)", fontSize: "20px", marginBottom: "12px" }}>
              Thank you for your report
            </h3>
            <p style={{ color: "var(--sc-muted)", lineHeight: 1.6, marginBottom: "24px" }}>
              Our team will review the content and take appropriate action.
              You will not be notified of the outcome, but your report helps keep Pulsify safe.
            </p>
            <button className="admin-btn admin-btn--primary" onClick={onClose} style={{ width: "100%" }}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Report Content</h2>
          <button className="admin-modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            {track && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "var(--sc-bg)", borderRadius: "8px", marginBottom: "24px" }}>
                <img src={track.cover || "https://i1.sndcdn.com/artworks-default.jpg"} alt={track.title} style={{ width: "48px", height: "48px", borderRadius: "6px", objectFit: "cover" }} />
                <div>
                  <div style={{ fontWeight: 600, color: "var(--sc-title)" }}>{track.title}</div>
                  <div style={{ fontSize: "13px", color: "var(--sc-muted)" }}>{track.artist}</div>
                </div>
              </div>
            )}

            <div className="admin-form-group">
              <label className="admin-form-label">Report Type</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {reportTypes.map((type) => (
                  <label key={type.value} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", background: reportType === type.value ? "var(--sc-orange-soft)" : "var(--sc-bg)", border: `1px solid ${reportType === type.value ? "var(--sc-orange)" : "var(--sc-border)"}`, borderRadius: "8px", cursor: "pointer", transition: "all 0.15s" }}>
                    <input type="radio" name="reportType" value={type.value} checked={reportType === type.value} onChange={(e) => setReportType(e.target.value)} style={{ marginTop: "4px", accentColor: "var(--sc-orange)" }} />
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--sc-title)", marginBottom: "4px" }}>{type.label}</div>
                      <div style={{ fontSize: "13px", color: "var(--sc-muted)" }}>{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Additional Details <span style={{ fontWeight: 400, color: "var(--sc-muted)" }}>(optional)</span></label>
              <textarea className="admin-form-textarea" placeholder="Provide any additional context..." value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
            </div>

            {error && (
              <div style={{ padding: "12px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px", color: "#ef4444", fontSize: "14px", marginBottom: "16px" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px", background: "var(--sc-bg)", borderRadius: "8px", fontSize: "13px", color: "var(--sc-muted)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "2px" }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Submitting a false report may result in action against your account.</span>
            </div>
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportDialog;
