import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const PulsifySquarePlaylistCard = ({ playlist }) => {
  const navigate = useNavigate();
  const plId = playlist._id || playlist.id;
  const creatorName = playlist.creator_id?.display_name || playlist.creator_username || 'You';
  
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }} onClick={() => navigate(`/playlists/${plId}`)}>
      <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative', overflow: 'hidden', borderRadius: '4px', backgroundColor: '#222' }}>
        <img 
          src={playlist.cover_url || 'https://placehold.co/200x200/1a1a1a/333?text=♫'} 
          alt={playlist.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Play button overlay on hover */}
        <div 
          className="square-play-overlay"
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s', zIndex: 10
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
        >
          <div style={{ width: '48px', height: '48px', backgroundColor: '#f50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: '4px' }}>
              <polygon points="6,3 20,12 6,21" />
            </svg>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Link 
          to={`/playlists/${plId}`} 
          style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          onClick={(e) => e.stopPropagation()}
        >
          {playlist.title}
        </Link>
        <Link 
          to={`/profile/${playlist.creator_id?._id || ''}`} 
          style={{ color: '#999', fontSize: '12px', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ccc'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
        >
          {creatorName}
        </Link>
      </div>
    </div>
  );
};
