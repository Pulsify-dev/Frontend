import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PulsifyPlaylistService } from '../../services/pulsifyPlaylistService';

const generateWaveform = () => Array.from({ length: 200 }, () => Math.random() * 0.7 + 0.3);

export const PulsifyPlaylistCard = ({ playlist, onDelete }) => {
  if (!playlist) return null;

  const navigate = useNavigate();
  const waveform = useMemo(() => generateWaveform(), []);
  const trackCount = playlist.track_count || playlist.tracks?.length || 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm(`Delete "${playlist.title}"? This cannot be undone.`)) return;
    try {
      await PulsifyPlaylistService.deletePlaylist(playlist.id);
      if (onDelete) onDelete(playlist.id);
    } catch (err) {
      alert('Failed to delete playlist: ' + err.message);
    }
  };

  return (
    <div className="pulsify-playlist-card">
      <div className="pulsify-artwork-wrapper" onClick={() => navigate(`/playlists/${playlist.id}`)} style={{ cursor: 'pointer' }}>
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

          {/* ─── MORE BUTTON WITH DROPDOWN ─── */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button className="pulsify-card-action-btn" title="More" onClick={() => setMenuOpen(!menuOpen)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', bottom: '42px', right: 0, zIndex: 100,
                backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '4px',
                minWidth: '180px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => { setMenuOpen(false); navigate(`/playlists/${playlist.id}`); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                    padding: '10px 14px', background: 'none', border: 'none',
                    color: '#ccc', fontSize: '13px', cursor: 'pointer', textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#333'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
                  Add to Next up
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                    padding: '10px 14px', background: 'none', border: 'none',
                    color: '#ccc', fontSize: '13px', cursor: 'pointer', textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#333'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  Delete Playlist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
