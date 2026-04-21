import React, { useState, useEffect, useContext } from 'react';
import { PulsifyPlaylistService } from '../services/pulsifyPlaylistService';
import { PulsifyPlaylistCard } from '../components/playlists/PulsifyPlaylistCard';
import { PulsifyCreatePlaylistModal } from '../components/playlists/PulsifyCreatePlaylistModal';
import { Link } from 'react-router-dom';
import { PulsifyAuthVaultContext } from '../store/PulsifyAuthVault';
import '../components/playlists/css/PulsifyPlaylists.css';

const profileBannerStyle = {
  background: 'linear-gradient(135deg, #3a2545 0%, #2a1a35 50%, #1e1428 100%)',
  padding: '50px 30px 0',
  position: 'relative',
  marginBottom: 0,
  maxWidth: '1240px',
  margin: '0 auto',
  borderRadius: '0',
};

const profileInnerStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: '20px',
  paddingBottom: '30px',
};

const avatarStyle = {
  width: '120px',
  height: '120px',
  borderRadius: '50%',
  backgroundColor: '#2a2a2a',
  border: '3px solid #333',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '48px',
  color: '#f50',
  flexShrink: 0,
  overflow: 'hidden',
};

const nameBlockStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  paddingBottom: '8px',
};

const displayNameStyle = {
  fontSize: '24px',
  fontWeight: 600,
  color: '#fff',
  backgroundColor: 'rgba(0,0,0,0.5)',
  padding: '4px 12px',
  display: 'inline-block',
};

const usernameStyle = {
  fontSize: '14px',
  color: '#ccc',
  backgroundColor: 'rgba(0,0,0,0.4)',
  padding: '2px 10px',
  display: 'inline-block',
};

const tabBarStyle = {
  maxWidth: '1240px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  gap: '0',
  borderBottom: '1px solid #222',
  backgroundColor: '#111',
  padding: '0 30px',
};

const tabStyle = (active) => ({
  padding: '12px 16px',
  fontSize: '13px',
  color: active ? '#fff' : '#999',
  borderBottom: active ? '2px solid #f50' : '2px solid transparent',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'color 0.12s',
  fontWeight: active ? 500 : 400,
});

const headerImageBtnStyle = {
  position: 'absolute',
  top: '16px',
  right: '30px',
  background: 'rgba(0,0,0,0.5)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#ccc',
  padding: '6px 14px',
  fontSize: '12px',
  borderRadius: '3px',
  cursor: 'pointer',
};

export const PulsifyPlaylistsView = () => {
  const [pulsifyPlaylists, setPulsifyPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { subscriptionTier } = useContext(PulsifyAuthVaultContext) || { subscriptionTier: 'FREE' };

  const totalTracksMocked = pulsifyPlaylists.reduce((acc, pl) => acc + (pl.track_count || pl.tracks?.length || 0), 0);
  const isUploadLocked = subscriptionTier !== 'PRO' && totalTracksMocked >= 3;

  const handleCreatePlaylist = async (payload) => {
    try {
      const result = await PulsifyPlaylistService.createPlaylist(payload);
      const newPlaylist = result.data || result;
      setPulsifyPlaylists(prev => [newPlaylist, ...prev]);
    } catch (err) {
      alert('Failed to create playlist: ' + err.message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadPulsifyData = async () => {
      try {
        setIsLoading(true);
        const data = await PulsifyPlaylistService.retrieveAllPlaylists('me');
        if (isMounted) {
          setPulsifyPlaylists(Array.isArray(data) ? data : data.playlists || []);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || 'Failed to retrieve playlist context.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPulsifyData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <div className="pulsify-util-msg" style={{ backgroundColor: '#111', minHeight: '100vh' }}>Loading your sets...</div>;
  }

  if (fetchError) {
    return <div className="pulsify-util-msg pulsify-err-msg" style={{ backgroundColor: '#111', minHeight: '100vh' }}>{fetchError}</div>;
  }

  return (
    <div style={{ backgroundColor: '#111', minHeight: '100vh', fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>

      <div style={profileBannerStyle}>
        <button style={headerImageBtnStyle}>Upload header image</button>
        <div style={profileInnerStyle}>
          <div style={avatarStyle}>
            <svg width="50" height="50" viewBox="0 0 24 24" fill="#f50" opacity="0.6">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div style={nameBlockStyle}>
            <span style={displayNameStyle}>i Omz</span>
            <span style={usernameStyle}>i Omz</span>
          </div>
        </div>
      </div>

      <div style={tabBarStyle}>
        <span style={tabStyle(false)}>All</span>
        <span style={tabStyle(false)}>Popular tracks</span>
        <span style={tabStyle(false)}>Tracks</span>
        <span style={tabStyle(false)}>Albums</span>
        <span style={tabStyle(true)}>Playlists</span>
        <span style={tabStyle(false)}>Reposts</span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button data-testid="create-playlist-btn" className="pulsify-btn pulsify-btn-dark" style={{ fontSize: '12px', padding: '5px 10px' }} onClick={() => setShowCreateModal(true)}>
            + Create
          </button>
          {isUploadLocked ? (
            <button className="pulsify-btn pulsify-btn-outline" onClick={() => alert('Free Tier Limit Reached (3 Tracks). Please upgrade to Pro or Go+ to upload more!')} style={{ color: '#999', borderColor: '#444', cursor: 'not-allowed', fontSize: '12px', padding: '5px 10px' }}>
              🔒 Upload Limit Reached
            </button>
          ) : (
            <Link data-testid="upload-track-link" to="/upload" className="pulsify-btn pulsify-btn-dark" style={{ fontSize: '12px', padding: '5px 10px' }}>
              Upload Track
            </Link>
          )}
          <Link data-testid="go-premium-link" to="/premium" className="pulsify-btn pulsify-btn-brand" style={{ fontSize: '12px', padding: '5px 10px' }}>
            Go Pro
          </Link>
        </div>
      </div>

      <div className="pulsify-playlists-container" style={{ paddingTop: '0' }}>
        <div className="pulsify-grid-container">
          {pulsifyPlaylists.length === 0 ? (
            <div className="pulsify-util-msg">You have no sets.</div>
          ) : (
            pulsifyPlaylists.map((pl) => (
              <PulsifyPlaylistCard 
                key={pl._id || pl.id} 
                playlist={pl} 
                onDelete={(id) => setPulsifyPlaylists(prev => prev.filter(p => (p._id || p.id) !== id))}
              />
            ))
          )}
        </div>
      </div>

      <PulsifyCreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePlaylist}
      />
    </div>
  );
};
