import './PulsifyFeedSection.css';

export const PulsifyFeedSection = ({ title, tracks, onPlayClick, onLikeClick, isLoading }) => {
  if (isLoading) {
    return (
      <section className="pulsify-feed-section" data-testid="feed-section-loading">
        <h2>{title}</h2>
        <div className="pulsify-skeleton-grid">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="pulsify-skeleton-card" />
          ))}
        </div>
      </section>
    );
  }

  if (!tracks || tracks.length === 0) {
    return (
      <section className="pulsify-feed-section" data-testid="feed-section-empty">
        <h2>{title}</h2>
        <p className="pulsify-empty-state">No tracks available</p>
      </section>
    );
  }

  return (
    <section className="pulsify-feed-section" data-testid={`feed-section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <h2>{title}</h2>
      <div className="pulsify-track-grid">
        {tracks.map(track => (
          <div key={track.id} className="pulsify-grid-item">
            {/* Render track card - will inject via consumer component */}
            {typeof onPlayClick === 'function' && (
              <div className="pulsify-track-preview">
                <img src={track.coverUrl} alt={track.title} />
                <h3>{track.title}</h3>
                <p>{track.artistName}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export const PulsifyLoadingSpinner = () => (
  <div className="pulsify-spinner" data-testid="loading-spinner">
    <div className="pulsify-spinner-dot" />
  </div>
);

export const PulsifyErrorAlert = ({ message, onRetry }) => (
  <div className="pulsify-error-alert" data-testid="error-alert">
    <p>{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="pulsify-retry-btn">
        Try Again
      </button>
    )}
  </div>
);
