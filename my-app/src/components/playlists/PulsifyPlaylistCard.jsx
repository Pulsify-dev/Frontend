import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PulsifyPlaylistService } from '../../services/pulsifyPlaylistService';

const generateWaveform = () => Array.from({ length: 200 }, () => Math.random() * 0.7 + 0.3);

export const PulsifyPlaylistCard = ({ playlist, onDelete }) => {
  if (!playlist) return null;

  const navigate = useNavigate();
  const waveform = useMemo(() => generateWaveform(), []);
  const plId = playlist._id || playlist.id;
  const trackCount = playlist.track_count || playlist.tracks?.length || 0;
  const creatorName = playlist.creator_id?.display_name || playlist.creator_username || 'You';
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
      await PulsifyPlaylistService.deletePlaylist(plId);
      if (onDelete) onDelete(plId);
    } catch (err) {
      alert('Failed to delete playlist: ' + err.message);
    }
  };

  return (
    <div className="pulsify-playlist-card">
      <div className="pulsify-artwork-wrapper" onClick={() => navigate(`/playlists/${plId}`)} style={{ cursor: 'pointer' }}>
        <img
          src={playlist.cover_url || 'https://placehold.co/160x160/1a1a1a/333?text=♫'}
          alt={playlist.title}
          className="pulsify-artwork"
        />
        <div className="pulsify-play-overlay">▶</div>
      </div>

      <div className="pulsify-card-body">
        <div className="pulsify-card-header-row">
          <button className="pulsify-card-play-btn" title="Play">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          </button>

          <div className="pulsify-card-info">
            <span className="pulsify-card-artist">{creatorName}</span>
            <Link to={`/playlists/${plId}`} className="pulsify-card-name">{playlist.title}</Link>
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
            {playlist.tracks.slice(0, 5).map((t, i) => {
              const trackData = t.track_id && typeof t.track_id === 'object' ? t.track_id : t;
              const trackPlays = trackData.play_count || '120K'; // Mock if missing
              return (
                <div key={trackData._id || trackData.id || i} className="pulsify-card-track-entry">
                  {trackData.artwork_url ? (
                    <img src={trackData.artwork_url} alt="" className="pulsify-card-track-thumb" style={{ width: '30px', height: '30px', borderRadius: '0' }} />
                  ) : (
                    <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg, #7122a3, #a24bcf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>♪</div>
                  )}
                  <span className="pulsify-card-track-idx">{i + 1}</span>
                  <span className="pulsify-card-track-title" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#999', marginRight: '6px' }}>{creatorName}</span>
                    {trackData.title}
                  </span>
                  <span className="pulsify-card-track-stats" style={{ color: '#666', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ▶ {trackPlays}
                  </span>
                </div>
              );
            })}
            {playlist.tracks.length > 5 && (
              <Link to={`/playlists/${plId}`} className="pulsify-card-view-all">
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
          <button className="pulsify-card-action-btn" title="Share">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </button>
          <button className="pulsify-card-action-btn" title="Copy Link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
          <button className="pulsify-card-action-btn" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button className="pulsify-card-action-btn" title="Like">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>

          {/* ─── MORE BUTTON WITH DROPDOWN ─── */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button 
              className="pulsify-card-action-btn" 
              title="More" 
              onClick={() => setMenuOpen(!menuOpen)}
              style={menuOpen ? { color: '#f50' } : {}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', top: '38px', left: 0, zIndex: 100,
                backgroundColor: '#111', border: '1px solid #333', borderRadius: '4px',
                minWidth: '180px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                overflow: 'hidden', padding: '4px 0'
              }}>
                <button
                  onClick={() => { setMenuOpen(false); navigate(`/playlists/${plId}`); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                    padding: '10px 16px', background: 'none', border: 'none',
                    color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h10M4 18h10M17 14v6M14 17h6"/></svg>
                  Add to Next up
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                    padding: '10px 16px', background: 'none', border: 'none',
                    color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
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
