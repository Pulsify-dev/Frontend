import React, { useState } from 'react';

export const PulsifyTrackRow = ({ track, index, onDragStart, onDragOver, onDrop, onDragEnd, onRemoveTrack }) => {
  const [hovered, setHovered] = useState(false);

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
        borderBottom: '1px solid #1e1e1e',
        padding: '8px 0',
        cursor: 'grab',
        backgroundColor: hovered ? '#1a1a1a' : 'transparent',
        transition: 'background-color 0.12s ease'
      }}
    >
      <img
        src={track.artwork_url || track.cover_art_url || 'https://placehold.co/28x28/252525/555?text=♫'}
        alt={track.title}
        width="28"
        height="28"
        style={{ marginRight: '8px', flexShrink: 0, borderRadius: '2px' }}
      />

      <div style={{ width: '28px', textAlign: 'center', marginRight: '10px', flexShrink: 0 }}>
        {hovered
          ? <span style={{ color: '#f50', fontSize: '12px', cursor: 'pointer' }}>▶</span>
          : <span style={{ color: '#555', fontSize: '13px' }}>{index + 1}</span>
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '13px', color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
          {track.title}
        </span>
        <span style={{ fontSize: '11px', color: '#666' }}>
          {track.artist_id?.display_name || track.artist_name || 'Unknown Artist'}
        </span>
      </div>

      {hovered && (
        <div style={{ display: 'flex', gap: '4px', marginRight: '12px', alignItems: 'center' }}>
          <TrackAction title="Share">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </TrackAction>
          <TrackAction title="Copy link">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </TrackAction>
          <TrackAction title="Like">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </TrackAction>
          <TrackAction title="Repost">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
          </TrackAction>
          <TrackAction title="More">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
          </TrackAction>
        </div>
      )}

      {!hovered && (
        <div style={{ color: '#555', fontSize: '12px', marginRight: '12px', flexShrink: 0 }}>
          {(() => { const sec = track.duration || track.duration_seconds || 0; return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`; })()}
        </div>
      )}

      {onRemoveTrack && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemoveTrack(index); }}
          style={{
            background: 'none', border: 'none',
            color: hovered ? '#666' : 'transparent',
            cursor: 'pointer', fontSize: '14px', padding: '0 4px',
            transition: 'color 0.12s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#f44'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
          title="Remove track from set"
        >
          &times;
        </button>
      )}
    </div>
  );
};

const TrackAction = ({ children, title }) => (
  <button
    title={title}
    style={{
      width: '26px', height: '26px', borderRadius: '50%',
      border: '1px solid #333', backgroundColor: '#1e1e1e',
      color: '#888', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 0, transition: 'border-color 0.12s, color 0.12s'
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#666'; e.currentTarget.style.color = '#fff'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#888'; }}
    onClick={e => e.stopPropagation()}
  >
    {children}
  </button>
);
