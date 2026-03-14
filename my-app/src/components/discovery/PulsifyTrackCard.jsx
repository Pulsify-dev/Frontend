import './PulsifyTrackCard.css';

export const PulsifyTrackCard = ({ track, onPlayClick, onLikeClick, isLiked }) => {
  return (
    <div className="pulsify-track-card" data-testid={`track-card-${track.id}`}>
      <div className="pulsify-track-cover">
        <img src={track.coverUrl} alt={track.title} />
        <button
          className="pulsify-play-btn"
          onClick={() => onPlayClick(track)}
          data-testid={`play-btn-${track.id}`}
        >
          ▶
        </button>
      </div>

      <div className="pulsify-track-info">
        <h3 className="pulsify-track-title" title={track.title}>
          {track.title}
        </h3>
        <p className="pulsify-track-artist">{track.artistName}</p>

        <div className="pulsify-track-stats">
          <span className="stat" data-testid={`plays-${track.id}`}>
            🎵 {(track.playCount / 1000).toFixed(1)}K
          </span>
          <button
            className={`pulsify-like-btn ${isLiked ? 'liked' : ''}`}
            onClick={() => onLikeClick(track)}
            data-testid={`like-btn-${track.id}`}
          >
            ❤ {track.likeCount}
          </button>
        </div>
      </div>
    </div>
  );
};
