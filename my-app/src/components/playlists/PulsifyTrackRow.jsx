import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../../hooks/usePlayer';

export const PulsifyTrackRow = ({ track, index, onDragStart, onDragOver, onDrop, onDragEnd, onRemoveTrack }) => {
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
    const trackId = track._id || track.id;
    const embedCode = `<iframe src="https://pulsify.page/tracks/embed/${trackId}" width="100%" height="166" frameborder="no" allow="autoplay"></iframe>`;
    navigator.clipboard.writeText(embedCode).then(() => {
      alert('Embed iframe copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy', err);
    });
  };

  if (!track) return null;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: 'none',
        padding: '8px 0',
        cursor: 'grab',
        backgroundColor: hovered ? '#2a2a2a' : 'transparent',
        transition: 'background-color 0.12s ease'
      }}
    >
      <div style={{ position: 'relative', width: '28px', height: '28px', marginRight: '8px', flexShrink: 0 }}>
        <img
          src={track.artwork_url || track.cover_art_url || 'https://placehold.co/28x28/252525/555?text=♫'}
          alt={track.title}
          style={{ width: '100%', height: '100%', borderRadius: '2px', objectFit: 'cover' }}
        />
        {hovered && (
          <div 
            onClick={(e) => { e.stopPropagation(); togglePlay(track); }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '2px' }}
          >
              <span style={{ color: '#f50', fontSize: '14px', backgroundColor: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: (() => {
                const currentId = currentTrack?.track_id?._id || currentTrack?.track_id || currentTrack?._id || currentTrack?.id;
                const trackId = track?._id || track?.id;
                return isPlaying && currentId === trackId ? '0' : '2px';
              })() }}>
                {(() => {
                  const currentId = currentTrack?.track_id?._id || currentTrack?.track_id || currentTrack?._id || currentTrack?.id;
                  const trackId = track?._id || track?.id;
                  return isPlaying && currentId === trackId ? '⏸' : '▶';
                })()}
              </span>
          </div>
        )}
      </div>

      <div style={{ width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px', flexShrink: 0, height: '100%' }}>
        <span style={{ color: '#999', fontSize: '13px', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>{index + 1}</span>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', fontSize: '14px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <span style={{ color: '#999', marginRight: '6px' }}>-</span>
        <span style={{ color: '#bbb', fontWeight: 'bold', marginRight: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
          {track.artist_id?.display_name || track.artist_name || track.artist?.name || 'Unknown Artist'}
        </span>
        <span style={{ color: '#999', marginRight: '6px' }}>-</span>
        <Link 
          to={`/track/${track._id || track.id}`}
          style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          {track.title}
        </Link>
      </div>

      {hovered && (
        <div style={{ display: 'flex', gap: '32px', marginRight: '16px', alignItems: 'center' }}>
          <TrackAction title="Like">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </TrackAction>
          <TrackAction title="Repost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
          </TrackAction>
          <TrackAction title="Share" onClick={handleShareClick}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </TrackAction>
          <TrackAction title="Add to Next up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="14" height="14" rx="2" ry="2"/><path d="M7 21h14a2 2 0 0 0 2-2V7"/></svg>
          </TrackAction>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <TrackAction title="More" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="14" height="14" rx="2" ry="2"/><path d="M7 21h14a2 2 0 0 0 2-2V7"/></svg>
                  Add to Next up
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); if (onRemoveTrack) onRemoveTrack(index); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#ccc', fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#222'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  Delete playlist
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!hovered && (
        <div style={{ color: '#555', fontSize: '12px', marginRight: '12px', flexShrink: 0 }}>
          {(() => { const sec = track.duration || track.duration_seconds || 0; return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`; })()}
        </div>
      )}
    </div>
  );
};

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
