import React from 'react';

/**
 * PulsifyPlaylistCard
 * A raw, currently unstyled presentational component that displays
 * a single playlist's basic metadata based on the adapted camelCase model.
 */
export const PulsifyPlaylistCard = ({ playlist }) => {
  // Defensive check in case data is malformed
  if (!playlist) return null;

  return (
    <div 
      className="setup-wrapper-playlist-card"
      style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}
    >
      <img 
        src={playlist.thumbnailUrl} 
        alt={`Cover art for ${playlist.playlistName}`} 
        width="150" 
        height="150" 
      />
      <h3>{playlist.playlistName}</h3>
      <p>Created by: {playlist.creatorId}</p>
      <p>{playlist.trackCount} Tracks | {playlist.isPublic ? 'Public Record' : 'Private Stash'}</p>
      <p><em>{playlist.playlistDescription}</em></p>
      
      {/* Action stubs for future days */}
      <button type="button">View Details</button>
    </div>
  );
};
