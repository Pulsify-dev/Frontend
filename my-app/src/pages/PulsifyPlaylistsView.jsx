import React, { useState, useEffect, useContext } from 'react';
import { PulsifyPlaylistService } from '../services/pulsifyPlaylistService';
import { PulsifyPlaylistCard } from '../components/playlists/PulsifyPlaylistCard';
import { PulsifyCreatePlaylistModal } from '../components/playlists/PulsifyCreatePlaylistModal';
import { Link } from 'react-router-dom';
import { PulsifyAuthVaultContext } from '../store/PulsifyAuthVault';
import '../components/playlists/css/PulsifyPlaylists.css';



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

      <div className="pulsify-profile-banner">
        <button className="pulsify-header-image-btn">Upload header image</button>
        <div className="pulsify-profile-inner">
          <div className="pulsify-profile-avatar">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="#f50" opacity="0.6">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div className="pulsify-profile-name-block">
            <span className="pulsify-profile-display-name">i Omz</span>
            <span className="pulsify-profile-username">i Omz</span>
          </div>
        </div>
      </div>

      <div className="pulsify-tab-bar">
        <span className="pulsify-tab">All</span>
        <span className="pulsify-tab">Popular tracks</span>
        <span className="pulsify-tab">Tracks</span>
        <span className="pulsify-tab">Albums</span>
        <span className="pulsify-tab active">Playlists</span>
        <span className="pulsify-tab">Reposts</span>

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

      <div className="pulsify-page-layout">
        {/* Left Main Column */}
        <div className="pulsify-main-column">
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

        {/* Right Sidebar Column */}
        <div className="pulsify-sidebar-column">
          <div className="pulsify-sidebar-stats">
            <div className="pulsify-stat-box">
              <span className="pulsify-stat-label">Followers</span>
              <span className="pulsify-stat-value">2</span>
            </div>
            <div className="pulsify-stat-box">
              <span className="pulsify-stat-label">Following</span>
              <span className="pulsify-stat-value">2</span>
            </div>
            <div className="pulsify-stat-box">
              <span className="pulsify-stat-label">Tracks</span>
              <span className="pulsify-stat-value">12</span>
            </div>
          </div>

          <div className="pulsify-sidebar-likes">
            <div className="pulsify-sidebar-likes-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
              2 Likes
              <Link to="/likes" className="view-all">View all</Link>
            </div>
            <div className="pulsify-liked-track">
              <img src="https://placehold.co/50x50/333/666?text=+" alt="Liked Track" />
              <div className="pulsify-liked-track-info">
                <span className="pulsify-liked-track-artist">Post Malone</span>
                <Link to="#" className="pulsify-liked-track-title">rockstar (feat. 21 Savage)</Link>
                <div className="pulsify-liked-track-stats">
                  <span>▶ 215M</span>
                  <span>❤️ 2.41M</span>
                  <span>🔁 120K</span>
                  <span>💬 25.1K</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pulsify-sidebar-promo">
            <div className="pulsify-sidebar-promo-header">
              ⓘ On Tour
            </div>
            <p className="pulsify-sidebar-promo-text">
              With an Artist Pro account, you can create ticketed live events on SoundCloud, and list existing events.
            </p>
            <Link to="/premium" className="pulsify-btn-pill-white" style={{ display: 'block' }}>
              Upgrade to Artist Pro
            </Link>
          </div>
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
