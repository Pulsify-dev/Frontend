import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

const generateWaveform = () => Array.from({ length: 200 }, () => Math.random() * 0.7 + 0.3);

export const PulsifyPlaylistCard = ({ playlist }) => {
  if (!playlist) return null;

  const waveform = useMemo(() => generateWaveform(), []);
  const trackCount = playlist.track_count || playlist.tracks?.length || 0;

  return (
    <div className="pulsify-playlist-card">
      <div className="pulsify-artwork-wrapper">
        <img
          src={playlist.thumbnail_url || 'https://placehold.co/160x160/1a1a1a/333?text=♫'}
          alt={playlist.title}
          className="pulsify-artwork"
        />
        <div className="pulsify-play-overlay">▶</div>
      </div>

      <div className="pulsify-card-body">
        <div className="pulsify-card-header-row">
          <button className="pulsify-card-play-btn" title="Play">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          </button>

          <div className="pulsify-card-info">
            <span className="pulsify-card-artist">{playlist.creator_username || 'You'}</span>
            <Link to={`/playlists/${playlist.id}`} className="pulsify-card-name">{playlist.title}</Link>
          </div>

          <span className="pulsify-card-time">2 hours ago</span>
        </div>

        <div className="pulsify-card-waveform">
          {waveform.map((h, i) => (
            <div
              key={i}
              className="pulsify-card-waveform-bar"
              style={{
                height: `${h * 100}%`,
                backgroundColor: i < 60 ? '#f50' : 'rgba(255,255,255,0.35)'
              }}
            />
          ))}
        </div>

        {playlist.tracks && playlist.tracks.length > 0 && (
          <div className="pulsify-card-tracklist">
            {playlist.tracks.slice(0, 3).map((t, i) => (
              <div key={t.id || i} className="pulsify-card-track-entry">
                <img
                  src={t.cover_art_url || 'https://placehold.co/20x20/222/555?text=♪'}
                  alt=""
                  className="pulsify-card-track-thumb"
                />
                <span className="pulsify-card-track-idx">{i + 1}</span>
                <span className="pulsify-card-track-dot">·</span>
                <span className="pulsify-card-track-title">{t.title}</span>
              </div>
            ))}
            {playlist.tracks.length > 3 && (
              <Link to={`/playlists/${playlist.id}`} className="pulsify-card-view-all">
                View all {playlist.tracks.length} tracks
              </Link>
            )}
          </div>
        )}

        {playlist.is_private && (
          <div className="pulsify-card-badges">
            <span className="pulsify-badge-secret">Secret</span>
            <span className="pulsify-track-count">{trackCount} tracks</span>
          </div>
        )}

        <div className="pulsify-card-actions">
          <Link to={`/playlists/${playlist.id}`} className="pulsify-card-action-btn" title="Edit & Reorder">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </Link>
          <button className="pulsify-card-action-btn" title="Copy link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
          <button className="pulsify-card-action-btn" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button className="pulsify-card-action-btn" title="Like">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>
          <button className="pulsify-card-action-btn" title="More">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
