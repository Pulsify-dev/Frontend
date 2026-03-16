import React from 'react';
import './PulsifyTrackRow.css';

// Presentational boundary for track visualization
const PulsifyTrackRow = ({ track, onPlay }) => {
  return (
    <div className="pulsify-track-row pulsify-glass-panel" data-testid={`track-row-${track.trackId}`}>
      <img src={track.coverArt} alt={track.title} className="pulsify-track-art" />
      <div className="pulsify-track-info">
        <h3>{track.title}</h3>
        <p className="artist-name">
          <img src={track.artist.avatarUrl} alt={track.artist.name} className="artist-avatar" />
          {track.artist.name}
        </p>
      </div>
      <div className="pulsify-track-stats">
        <span title="Plays">▶ {track.plays}</span>
        <span title="Likes">♥ {track.likes}</span>
        <span title="Reposts">⇄ {track.reposts}</span>
      </div>
      <div className="pulsify-track-actions">
        <button className="pulsify-btn-primary play-btn" onClick={() => onPlay(track)}>
          Play
        </button>
      </div>
    </div>
  );
};

export default PulsifyTrackRow;
