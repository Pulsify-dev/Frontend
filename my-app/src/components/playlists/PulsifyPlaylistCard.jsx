import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PulsifyPlaylistService } from '../../services/pulsifyPlaylistService';
import { usePlayer } from '../../hooks/usePlayer';
import { PulsifyEditPlaylistModal } from './PulsifyEditPlaylistModal';
import { PulsifyShareModal } from './PulsifyShareModal';

const generateWaveform = () => Array.from({ length: 200 }, () => Math.random() * 0.7 + 0.3);

const TrackAction = ({ children, title, onClick }) => (
  <button
    title={title}
    onClick={onClick || (e => e.stopPropagation())}
    style={{
      background: 'none', border: 'none', padding: '4px',
      color: '#999', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'color 0.12s'
    }}
    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
    onMouseLeave={e => e.currentTarget.style.color = '#999'}
  >
    {children}
  </button>
);

const PulsifyCardTrackEntry = ({ trackData, i, creatorName, plId }) => {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { togglePlay, isPlaying, currentTrack } = usePlayer();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShareClick = (e) => {
    e.stopPropagation();
    const trackId = trackData._id || trackData.id;
    const embedCode = `<iframe src="https://pulsify.page/tracks/embed/${trackId}" width="100%" height="166" frameborder="no" allow="autoplay"></iframe>`;
    navigator.clipboard.writeText(embedCode).then(() => {
      alert('Embed iframe copied to clipboard!');
    }).catch(err => console.error('Failed to copy', err));
  };

  const trackPlays = trackData.play_count || '120K';

  return (
    <div
      className="pulsify-card-track-entry"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: hovered ? '#2a2a2a' : 'transparent', transition: 'background-color 0.12s' }}
    >
      <div style={{ position: 'relative', width: '30px', height: '30px', marginRight: '8px', flexShrink: 0 }}>
        {trackData.artwork_url ? (
          <img src={trackData.artwork_url} alt="" className="pulsify-card-track-thumb" style={{ width: '100%', height: '100%', borderRadius: '0' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #7122a3, #a24bcf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>♪</div>
        )}
        {hovered && (
          <div
            onClick={(e) => { e.stopPropagation(); togglePlay(trackData); }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <span style={{ color: '#f50', fontSize: '14px', backgroundColor: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: isPlaying && currentTrack && (currentTrack.trackId === (trackData._id || trackData.id) || currentTrack._id === (trackData._id || trackData.id)) ? '0' : '2px' }}>
              {isPlaying && currentTrack && (currentTrack.trackId === (trackData._id || trackData.id) || currentTrack._id === (trackData._id || trackData.id)) ? '⏸' : '▶'}
            </span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', fontSize: '14px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <span className="pulsify-card-track-idx" style={{ fontWeight: 'bold', color: '#999', marginRight: '6px' }}>{i + 1}</span>
        <span style={{ color: '#999', marginRight: '6px' }}>-</span>
        <span style={{ color: '#bbb', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
          {trackData.artist_id?.display_name || trackData.artist_name || trackData.artist?.name || creatorName}
        </span>
        <span style={{ color: '#999', margin: '0 6px' }}>-</span>
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {trackData.title || 'Untitled'}
        </span>
      </div>

      {hovered ? (
        <div style={{ display: 'flex', gap: '42px', marginLeft: 'auto', alignItems: 'center', paddingLeft: '8px' }}>
          <TrackAction title="Like">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          </TrackAction>
          <TrackAction title="Repost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
          </TrackAction>
          <TrackAction title="Share" onClick={handleShareClick}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
          </TrackAction>
          <TrackAction title="Add to Next up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="14" height="14" rx="2" ry="2" /><path d="M7 21h14a2 2 0 0 0 2-2V7" /></svg>
          </TrackAction>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <TrackAction title="More" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
            </TrackAction>
            {menuOpen && (
              <div style={{
                position: 'absolute', top: '24px', right: 0, zIndex: 100,
                backgroundColor: '#111', border: '1px solid #333', borderRadius: '4px',
                minWidth: '160px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                overflow: 'hidden', padding: '4px 0'
              }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#ccc', fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#222'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="14" height="14" rx="2" ry="2" /><path d="M7 21h14a2 2 0 0 0 2-2V7" /></svg>
                  Add to Next up
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#ccc', fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#222'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                  Delete playlist
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <span className="pulsify-card-track-stats" style={{ color: '#666', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ▶ {trackPlays}
        </span>
      )}
    </div>
  );
};

export const PulsifyPlaylistCard = ({ playlist, onDelete }) => {
  if (!playlist) return null;
  const [localPlaylist, setLocalPlaylist] = useState(playlist);
  const navigate = useNavigate();
  const waveform = useMemo(() => generateWaveform(), []);
  const plId = localPlaylist._id || localPlaylist.id;
  const trackCount = localPlaylist.track_count || localPlaylist.tracks?.length || 0;
  const creatorName = localPlaylist.creator_id?.display_name || localPlaylist.creator_username || 'You';
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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

  const { togglePlay, isPlaying, currentTrack } = usePlayer();

  const handlePlaylistShare = () => {
    setIsShareModalOpen(true);
  };

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
          src={localPlaylist.cover_url || 'https://placehold.co/160x160/1a1a1a/333?text=♫'}
          alt={localPlaylist.title}
          className="pulsify-artwork"
        />
        <div 
          className="pulsify-play-overlay"
          onClick={(e) => {
            e.stopPropagation();
            if (localPlaylist.tracks && localPlaylist.tracks.length > 0) {
              const firstTrack = localPlaylist.tracks[0].track_id && typeof localPlaylist.tracks[0].track_id === 'object' ? localPlaylist.tracks[0].track_id : localPlaylist.tracks[0];
              togglePlay(firstTrack);
            } else {
              alert('No tracks to play in this playlist!');
            }
          }}
        >
          {isPlaying && currentTrack && localPlaylist.tracks?.[0] && (localPlaylist.tracks[0].track_id?._id || localPlaylist.tracks[0]._id || localPlaylist.tracks[0].id) === (currentTrack._id || currentTrack.id) ? '⏸' : '▶'}
        </div>
      </div>

      <div className="pulsify-card-body">
        <div className="pulsify-card-header-row">
          <button 
            className="pulsify-card-play-btn" 
            title={isPlaying && currentTrack && localPlaylist.tracks?.[0] && (localPlaylist.tracks[0].track_id?._id || localPlaylist.tracks[0]._id || localPlaylist.tracks[0].id) === (currentTrack._id || currentTrack.id) ? "Pause" : "Play"}
            onClick={(e) => {
              e.stopPropagation();
              if (localPlaylist.tracks && localPlaylist.tracks.length > 0) {
                const firstTrack = localPlaylist.tracks[0].track_id && typeof localPlaylist.tracks[0].track_id === 'object' ? localPlaylist.tracks[0].track_id : localPlaylist.tracks[0];
                togglePlay(firstTrack);
              } else {
                alert('No tracks to play in this playlist!');
              }
            }}
          >
            {isPlaying && currentTrack && localPlaylist.tracks?.[0] && (localPlaylist.tracks[0].track_id?._id || localPlaylist.tracks[0]._id || localPlaylist.tracks[0].id) === (currentTrack._id || currentTrack.id) ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            )}
          </button>

          <div className="pulsify-card-info">
            <span className="pulsify-card-artist">{creatorName}</span>
            <Link to={`/playlists/${plId}`} className="pulsify-card-name">{localPlaylist.title}</Link>
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

        {localPlaylist.tracks && localPlaylist.tracks.length > 0 && (
          <div className="pulsify-card-tracklist">
            {localPlaylist.tracks.slice(0, 5).map((t, i) => {
              const trackData = t.track_id && typeof t.track_id === 'object' ? t.track_id : t;
              return (
                <PulsifyCardTrackEntry
                  key={trackData._id || trackData.id || i}
                  trackData={trackData}
                  i={i}
                  creatorName={creatorName}
                  plId={plId}
                />
              );
            })}
            {localPlaylist.tracks.length > 5 && (
              <Link to={`/playlists/${plId}`} className="pulsify-card-view-all">
                View all {localPlaylist.tracks.length} tracks
              </Link>
            )}
          </div>
        )}

        {localPlaylist.is_private && (
          <div className="pulsify-card-badges">
            <span className="pulsify-badge-secret">Secret</span>
            <span className="pulsify-track-count">{trackCount} tracks</span>
          </div>
        )}

        <div className="pulsify-card-actions">
          <button className="pulsify-card-action-btn" title="Share" onClick={handlePlaylistShare}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
          </button>
          <button className="pulsify-card-action-btn" title="Copy Link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
          </button>
          <button className="pulsify-card-action-btn" title="Edit" onClick={() => setIsEditModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
          <button className="pulsify-card-action-btn" title="Like">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          </button>

          {/* ─── MORE BUTTON WITH DROPDOWN ─── */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              className="pulsify-card-action-btn"
              title="More"
              onClick={() => setMenuOpen(!menuOpen)}
              style={menuOpen ? { color: '#f50' } : {}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h10M4 18h10M17 14v6M14 17h6" /></svg>
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                  Delete Playlist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <PulsifyEditPlaylistModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        playlist={localPlaylist}
        onSaveSuccess={(updated) => setLocalPlaylist(updated)}
      />
      <PulsifyShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        playlist={localPlaylist}
      />
    </div>
  );
};
