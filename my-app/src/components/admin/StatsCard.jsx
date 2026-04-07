const StatsCard = ({ icon, iconClass, value, label, change, changeType }) => {
  return (
    <div className="admin-stat-card">
      <div className={`admin-stat-icon ${iconClass}`}>{icon}</div>
      <div className="admin-stat-content">
        <div className="admin-stat-value">{value}</div>
        <div className="admin-stat-label">{label}</div>
        {change && (
          <div
            className={`admin-stat-change ${
              changeType === "up"
                ? "admin-stat-change--up"
                : "admin-stat-change--down"
            }`}
          >
            {changeType === "up" ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
            {change}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
