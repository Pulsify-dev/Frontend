import React from 'react';
import './PulsifyTrackRow.css';
import { usePlayer } from '../../hooks/usePlayer';

// SoundCloud-style track card with waveform placeholder
const PulsifyTrackRow = ({ track, onLike, onRepost, isLiked, isReposted }) => {
  const { currentTrack, isPlaying, togglePlay } = usePlayer();
  const isActive = currentTrack?.id === track.trackId;

  const formatDuration = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`sc-track-card ${isActive ? 'sc-track-active' : ''}`} data-testid={`track-row-${track.trackId}`}>
      {/* Cover Art with Play Overlay */}
      <div
        className="sc-track-art-wrap"
        onClick={() => togglePlay(track, { playbackContext: 'discovery' })}
      >
        <img src={track.coverArt} alt={track.title} className="sc-track-art" />
        <div className="sc-play-overlay">
          <div className="sc-play-circle">
            {isActive && isPlaying ? '⏸' : '▶'}
          </div>
        </div>
      </div>

      {/* Track Body */}
      <div className="sc-track-body">
        {/* Top row: artist + title */}
        <div className="sc-track-header">
          <div className="sc-track-meta">
            <span className="sc-track-artist">{track.artist.name}</span>
            <span className="sc-track-title">{track.title}</span>
          </div>
          <span className="sc-track-time">{track.uploadedAt || '2 hours ago'}</span>
        </div>

        {/* Waveform placeholder */}
        <div className="sc-waveform">
          <div className="sc-waveform-bars">
            {Array.from({ length: 80 }).map((_, i) => {
              const h = 8 + Math.floor(Math.random() * 24);
              return <div key={i} className="sc-wave-bar" style={{ height: `${h}px` }} />;
            })}
          </div>
          <div className="sc-waveform-duration">{formatDuration(track.durationSeconds)}</div>
        </div>

        {/* Bottom row: action buttons + stats */}
        <div className="sc-track-footer">
          <div className="sc-track-actions">
            <button
              className={`sc-btn ${isLiked ? 'active' : ''}`}
              onClick={() => onLike(track.trackId)}
              data-testid={`like-btn-${track.trackId}`}
            >
              ♥ {isLiked ? 'Liked' : 'Like'}
            </button>
            <button
              className={`sc-btn ${isReposted ? 'active' : ''}`}
              onClick={() => onRepost(track.trackId)}
              data-testid={`repost-btn-${track.trackId}`}
            >
              ⇄ Repost
            </button>
            <button className="sc-btn">↗ Share</button>
            <button className="sc-btn">⋯ More</button>
          </div>

          <div className="sc-track-counters">
            <span className="sc-counter" title="Plays">▶ {track.plays?.toLocaleString()}</span>
            <span className="sc-counter" title="Likes">♥ {track.likes + (isLiked ? 1 : 0)}</span>
            <span className="sc-counter" title="Reposts">⇄ {track.reposts + (isReposted ? 1 : 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PulsifyTrackRow;
