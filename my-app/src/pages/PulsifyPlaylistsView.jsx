import React, { useState, useEffect, useContext } from 'react';
import { PulsifyPlaylistService } from '../services/pulsifyPlaylistService';
import { PulsifyTrackService } from '../services/pulsifyTrackService';
import { PulsifyPlaylistCard } from '../components/playlists/PulsifyPlaylistCard';
import { PulsifyCreatePlaylistModal } from '../components/playlists/PulsifyCreatePlaylistModal';
import { Link } from 'react-router-dom';
import { PulsifyAuthVaultContext } from '../store/PulsifyAuthVault';
import { pulsifyAxiosInstance } from '../services/api';
import '../components/playlists/css/PulsifyPlaylists.css';



export const PulsifyPlaylistsView = () => {
  const [pulsifyPlaylists, setPulsifyPlaylists] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);
  const [likedCount, setLikedCount] = useState(0);
  const [socialStats, setSocialStats] = useState({ followers: 0, following: 0 });
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
          const rawPlaylists = Array.isArray(data) ? data : data.playlists || [];
          // Fetch detailed data for each playlist to populate track titles
          const detailedPlaylists = await Promise.all(
            rawPlaylists.map(async (pl) => {
              try {
                const detailed = await PulsifyPlaylistService.getPlaylistById(pl._id || pl.id);
                return detailed.data || detailed || pl;
              } catch (e) {
                return pl; // fallback to raw
              }
            })
          );
          setPulsifyPlaylists(detailedPlaylists);
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

    const fetchLikes = async () => {
      try {
        const res = await PulsifyTrackService.getLikedTracks().catch(() => ({ data: [], count: 0 }));
        if (isMounted) {
          // Merge remote data with local demo state
          const remoteTracks = res.data || [];
          let localTracks = [];
          try {
            const localStr = localStorage.getItem('pulsifyLikedTracks');
            if (localStr) localTracks = JSON.parse(localStr);
          } catch (e) {}
          // Simple deduplication by track ID
          const merged = [...localTracks, ...remoteTracks].filter((v, i, a) => 
            a.findIndex(t => (t._id || t.id) === (v._id || v.id)) === i
          );
          setLikedTracks(merged);
          setLikedCount(merged.length || res.count || 0);
        }
      } catch (err) {
        console.error('Failed to fetch liked tracks', err);
      }
    };

    const fetchSocialCounts = async () => {
      try {
        const { data: res } = await pulsifyAxiosInstance.get('/users/me/social-counts');
        if (isMounted && res?.data) {
          setSocialStats({
            followers: res.data.followers_count || 0,
            following: res.data.following_count || 0
          });
        }
      } catch (err) {
        console.warn('Failed to fetch social counts', err);
      }
    };

    loadPulsifyData();
    fetchLikes();
    fetchSocialCounts();

    const handleLikesUpdated = () => fetchLikes();
    window.addEventListener('pulsify-likes-updated', handleLikesUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('pulsify-likes-updated', handleLikesUpdated);
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
              <span className="pulsify-stat-value">{socialStats.followers}</span>
            </div>
            <div className="pulsify-stat-box">
              <span className="pulsify-stat-label">Following</span>
              <span className="pulsify-stat-value">{socialStats.following}</span>
            </div>
            <div className="pulsify-stat-box">
              <span className="pulsify-stat-label">Tracks</span>
              <span className="pulsify-stat-value">{totalTracksMocked}</span>
            </div>
          </div>

          <div className="pulsify-sidebar-likes">
            <div className="pulsify-sidebar-likes-header" style={{ borderBottom: 'none' }}>
              {likedCount} LIKES
              <Link to="/likes" className="view-all">View all</Link>
            </div>
            {likedTracks.length === 0 ? (
              <div style={{ color: '#999', fontSize: '12px', padding: '10px 0' }}>No liked tracks yet.</div>
            ) : (
              likedTracks.slice(0, 3).map((trackData, idx) => {
                const t = trackData.track_id || trackData;
                return (
                  <div className="pulsify-liked-track" key={t._id || t.id || idx} style={{ marginBottom: '12px' }}>
                    <img src={t.artwork_url || t.cover_art_url || 'https://placehold.co/50x50/333/666?text=♫'} alt={t.title} style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                    <div className="pulsify-liked-track-info">
                      <span className="pulsify-liked-track-artist">{t.artist_id?.display_name || t.artist_name || t.artist?.name || 'Unknown Artist'}</span>
                      <Link to={`/tracks/${t._id || t.id}`} className="pulsify-liked-track-title">{t.title}</Link>
                      <div className="pulsify-liked-track-stats">
                        <span>▶ {t.play_count || 0}</span>
                        <span>❤️ {t.like_count || 0}</span>
                        <span>🔁 {t.repost_count || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pulsify-sidebar-promo">
            <div className="pulsify-sidebar-promo-header" style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', color: '#fff', fontSize: '13px', marginBottom: '15px', paddingBottom: '8px', borderBottom: 'none' }}>
              <svg viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: '14px', marginRight: '6px' }}><path d="M13.25 3.75V4.25M13.25 7.75V8.25M13.25 11.75V12.25M2.75 0.75H17.25C18.3546 0.75 19.25 1.64543 19.25 2.75V5.25C16.5 6 16.5 10 19.25 10.75V13.25C19.25 14.3546 18.3546 15.25 17.25 15.25H2.75C1.64543 15.25 0.75 14.3546 0.75 13.25V10.75C3.5 10 3.5 6 0.75 5.25V2.75C0.75 1.64543 1.64543 0.75 2.75 0.75Z" stroke="#959595" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              ON TOUR
            </div>
            <p className="pulsify-sidebar-promo-text" style={{ color: '#fff', fontSize: '13px', lineHeight: '1.4' }}>
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
