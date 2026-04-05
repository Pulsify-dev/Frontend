import React from 'react';

export const PulsifyTrackRow = ({ track, index, onDragStart, onDragOver, onDrop, onDragEnd }) => {
  if (!track) return null;

  return (
    <div
      className="setup-wrapper-track-row"
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e5e5', padding: '10px 0', cursor: 'grab', backgroundColor: '#fff' }}
    >
      <div style={{ width: '30px', color: '#999', fontSize: '14px', textAlign: 'center', marginRight: '10px' }}>
        {index + 1}
      </div>
      <img
        src={track.cover_art_url || 'https://via.placeholder.com/40'}
        alt={track.title}
        width="40"
        height="40"
        style={{ marginRight: '15px' }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '400', fontSize: '14px', color: '#333' }}>{track.title}</div>
        <div style={{ fontSize: '12px', color: '#999' }}>{track.artist_name || 'Unknown Artist'}</div>
      </div>
      <div style={{ marginRight: '20px' }}>
        {track.is_explicit ? <span style={{ color: '#f50', fontSize: '10px', border: '1px solid #f50', padding: '2px 4px', borderRadius: '2px' }}>E</span> : null}
      </div>
      <div style={{ color: '#999', fontSize: '12px' }}>
        {Math.floor((track.duration_seconds || 0) / 60)}:{((track.duration_seconds || 0) % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
};
