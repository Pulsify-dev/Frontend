import React, { useState } from 'react';
import { usePlayer } from '../../hooks/usePlayer';
import './PulsifyPlayerBar.css';

const PulsifyPlayerBar = () => {
  const { currentTrack, isPlaying, togglePlay } = usePlayer();
  const [progress, setProgress] = useState(35);
  const [volume, setVolume] = useState(80);

  if (!currentTrack) return null;

  const formatTime = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentTime = Math.floor((currentTrack.durationSeconds || 180) * (progress / 100));
  const totalTime = currentTrack.durationSeconds || 180;

  return (
    <div className="sc-player" data-testid="global-player-bar">
      {/* Controls */}
      <div className="sc-player-controls">
        <button className="sc-player-btn" title="Previous">⏮</button>
        <button
          className="sc-player-btn sc-player-play"
          onClick={() => togglePlay(currentTrack)}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="sc-player-btn" title="Next">⏭</button>
      </div>

      {/* Progress */}
      <div className="sc-player-progress-section">
        <span className="sc-player-time">{formatTime(currentTime)}</span>
        <div className="sc-player-progress-track" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = ((e.clientX - rect.left) / rect.width) * 100;
          setProgress(Math.max(0, Math.min(100, pct)));
        }}>
          <div className="sc-player-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="sc-player-time">{formatTime(totalTime)}</span>
      </div>

      {/* Volume */}
      <div className="sc-player-volume">
        <button className="sc-player-btn" title="Volume">
          {volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="sc-volume-slider"
        />
      </div>

      {/* Track Info */}
      <div className="sc-player-trackinfo">
        <img src={currentTrack.coverArt} alt={currentTrack.title} className="sc-player-art" />
        <div className="sc-player-meta">
          <span className="sc-player-artist">{currentTrack.artist.name}</span>
          <span className="sc-player-title">{currentTrack.title}</span>
        </div>
      </div>
    </div>
  );
};

export default PulsifyPlayerBar;
