import React from 'react';
import './PulsifyTrackRow.css';
import { usePlayer } from '../../hooks/usePlayer';
import ReportModal from './ReportModal';

const PulsifyTrackRow = ({ track, onLike, onRepost, isLiked, isReposted }) => {
  const { currentTrack, isPlaying, togglePlay } = usePlayer();
  const isActive = currentTrack?.trackId === track.trackId;
  const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);

  const formatDuration = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="sc-feed-wrapper" data-testid={`feed-wrapper-${track.trackId}`}>
      <div className="sc-feed-item-header">
        <div className="sc-feed-item-avatar">
          {track.artist?.avatarUrl ? (
            <img src={track.artist.avatarUrl} alt={track.artist?.name} />
          ) : (
            <div className="sc-avatar-placeholder"></div>
          )}
        </div>
        <div className="sc-feed-item-context">
          <span className="sc-feed-context-name">{track.artist?.name || 'Artist'}</span>
          <span className="sc-feed-context-action">{track.actionText || 'posted a track'}</span>
          <span className="sc-feed-context-time">{track.uploadedAt || '2 hours ago'}</span>
        </div>
      </div>

      <div className={`sc-track-card ${isActive ? 'sc-track-active' : ''}`} data-testid={`track-row-${track.trackId}`}>
        <div className="sc-track-art-wrap" onClick={() => togglePlay(track)}>
          <img src={track.coverArt || 'https://via.placeholder.com/160'} alt={track.title} className="sc-track-art" />
          <div className="sc-play-overlay">
            <div className="sc-play-circle">
              {isActive && isPlaying ? '⚽' : '▝'}
            </div>
          </div>
        </div>

        <div className="sc-track-body">
          <div className="sc-track-header">
            <div className="sc-track-meta">
              <span className="sc-track-artist">{track.artist?.name || 'Artist'}</span>
              <span className="sc-track-title">{track.title}</span>
            </div>
            {track.genre && <span className="sc-track-genre">#{track.genre}</span>}
          </div>

          <div className="sc-waveform">
            <div className="sc-waveform-bars">
              {Array.from({ length: 80 }).map((_, i) => {
                const h = 8 + Math.floor(Math.random() * 24);
                return <div key={i} className="sc-wave-bar" style={{ height: `${h}px` }} />;
              })}
            </div>
            <div className="sc-waveform-duration">{formatDuration(track.durationSeconds)}</div>
          </div>

          <div className="sc-track-footer">
            <div className="sc-track-actions">
              <button className={`sc-btn ${isLiked ? 'active' : ''}`} onClick={() => onLike(track.trackId)}>♅ {isLiked ? track.likes + 1 : track.likes}</button>
              <button className={`sc-btn ${isReposted ? 'active' : ''}`} onClick={() => onRepost(track.trackId)}>𓅄 {	sReposted ? track.reposts + 1 : track.reposts}</button>
              <button className="sc-btn">🔥 Share</button>
              <button className="sc-btn">𝆋 Copy Link</button>
              <button className="sc-btn" onClick={() => setIsReportModalOpen(true)}>🚩 Report</button>
              <button className="sc-btn">⋯ More</button>
            </div>
            <div className="sc-track-counters">
              <span className="sc-counter">▭ {track.plays?.toLocaleString()}</span>
              <span className="sc-counter">𝒬 {track.comments}</span>
            </div>
          </div>
        </div>
      </div>

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        entityType="Track" 
        entityId={track.trackId} 
      />
    </div>
  );
};

export default PulsifyTrackRow;