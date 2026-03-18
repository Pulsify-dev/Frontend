import React from 'react';
import { usePlayer } from '../../hooks/usePlayer';
import './PulsifyPlayerBar.css';

const PulsifyPlayerBar = () => {
  const { currentTrack, isPlaying, togglePlay } = usePlayer();

  if (!currentTrack) return null;

  return (
    <div className="pulsify-player-bar pulsify-glass-panel" data-testid="global-player-bar">
      <div className="player-track-info">
        <img src={currentTrack.coverArt} alt={currentTrack.title} className="player-art" />
        <div className="player-meta">
          <h4>{currentTrack.title}</h4>
          <p>{currentTrack.artist.name}</p>
        </div>
      </div>

      <div className="player-controls">
        <button className="control-btn" title="Previous">⏮</button>
        <button 
          className="control-btn play-pause-btn" 
          onClick={() => togglePlay(currentTrack)}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="control-btn" title="Next">⏭</button>
      </div>

      <div className="player-settings">
        <button className="control-btn" title="Volume">🔊</button>
      </div>
    </div>
  );
};

export default PulsifyPlayerBar;
