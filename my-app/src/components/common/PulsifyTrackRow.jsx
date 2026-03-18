import React from 'react';
import './PulsifyTrackRow.css';
import { usePlayer } from '../../hooks/usePlayer';

// Presentational component that consumes global player context
const PulsifyTrackRow = ({ track, onLike, onRepost, isLiked, isReposted }) => {
  const { currentTrack, isPlaying, togglePlay } = usePlayer();
  const isCurrentlyPlaying = currentTrack?.trackId === track.trackId;

  return (
    <div 
      className={`pulsify-track-row pulsify-glass-panel ${isCurrentlyPlaying ? 'playing-glow' : ''}`} 
      data-testid={`track-row-${track.trackId}`}
    >
      <div className="art-wrapper" onClick={() => togglePlay(track)}>
        <img src={track.coverArt} alt={track.title} className="pulsify-track-art" />
        <div className="play-overlay">
          {isCurrentlyPlaying && isPlaying ? '⏸' : '▶'}
        </div>
      </div>
      
      <div className="pulsify-track-info" onClick={() => togglePlay(track)}>
        <h3>{track.title}</h3>
        <p className="artist-name">
          <img src={track.artist.avatarUrl} alt={track.artist.name} className="artist-avatar" />
          {track.artist.name}
        </p>
      </div>
      
      <div className="pulsify-track-stats">
        <span title="Plays">▶ {track.plays}</span>
        <button 
          className={`stat-btn like-btn ${isLiked ? 'active' : ''}`} 
          onClick={() => onLike(track.trackId)}
          title="Like"
        >
          ♥ {track.likes + (isLiked ? 1 : 0)}
        </button>
        <button 
          className={`stat-btn repost-btn ${isReposted ? 'active' : ''}`} 
          onClick={() => onRepost(track.trackId)}
          title="Repost"
        >
          ⇄ {track.reposts + (isReposted ? 1 : 0)}
        </button>
      </div>
    </div>
  );
};

export default PulsifyTrackRow;
