import React from 'react';
import { Link } from 'react-router-dom';

export const PulsifyPlaylistCard = ({ playlist }) => {
  if (!playlist) return null;

  return (
    <div className="pulsify-playlist-card">
      <div className="pulsify-artwork-wrapper">
        <img 
          src={playlist.thumbnail_url || 'https://via.placeholder.com/150'} 
          alt={playlist.title} 
          className="pulsify-artwork"
        />
        <div className="pulsify-play-overlay">
           <span>▶</span>
        </div>
      </div>
      
      <div className="pulsify-card-meta">
        <h3 className="pulsify-card-title">{playlist.title}</h3>
        <p className="pulsify-card-subtitle">{playlist.creator_username || 'You'}</p>
        
        <div className="pulsify-badge-row">
          {playlist.is_private && <span className="pulsify-badge-secret">Secret</span>}
          <span className="pulsify-track-count">{playlist.track_count || 0} tracks</span>
        </div>
        
        <div className="pulsify-card-actions">
           <Link to={`/playlists/${playlist.id}`} className="pulsify-btn pulsify-btn-outline">
             Edit & Reorder
           </Link>
        </div>
      </div>
    </div>
  );
};
