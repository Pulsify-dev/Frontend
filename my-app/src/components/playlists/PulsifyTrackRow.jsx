import React from 'react';

export const PulsifyTrackRow = ({ track, index, onMoveUp, onMoveDown, isFirst, isLast }) => {
  if (!track) return null;

  return (
    <div 
      className="setup-wrapper-track-row"
      style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #444', padding: '10px 0' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', marginRight: '10px' }}>
        <button onClick={() => onMoveUp(index)} disabled={isFirst} style={{ background: 'none', border: 'none', cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.3 : 1, color: '#aaa' }}>&#9650;</button>
        <button onClick={() => onMoveDown(index)} disabled={isLast} style={{ background: 'none', border: 'none', cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.3 : 1, color: '#aaa' }}>&#9660;</button>
      </div>
      <div style={{ width: '30px', color: '#888' }}>{index + 1}</div>
      <img 
        src={track.coverArtUrl} 
        alt={track.trackTitle} 
        width="40" 
        height="40" 
        style={{ marginRight: '15px' }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold' }}>{track.trackTitle}</div>
        <div style={{ fontSize: '0.85em', color: '#aaa' }}>{track.artistName}</div>
      </div>
      <div style={{ marginRight: '20px' }}>
        {track.isExplicit ? <span style={{ color: 'red', fontSize: '10px', border: '1px solid red', padding: '2px' }}>E</span> : null}
      </div>
      <div>
        {Math.floor(track.durationSeconds / 60)}:{(track.durationSeconds % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
};
