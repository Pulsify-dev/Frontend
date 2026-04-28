import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../hooks/usePlayer';
import serviceLocator from '../utils/serviceLocator';
import { getListeningHistory } from '../services/api';
import ArtistToolsWidget from '../components/common/ArtistToolsWidget';
import ReportModal from '../components/common/ReportModal';
import { PulsifyPlaylistCard } from '../components/playlists/PulsifyPlaylistCard';
import { PulsifyAlbumCard } from '../components/albums/PulsifyAlbumCard';
import { PulsifyTrackCard } from '../components/discovery/PulsifyTrackCard';
import './FeedPage.css';
import './DiscoveryFeedPage.css';

// Format relative time
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} months ago`;
};

// Format duration seconds to mm:ss
const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const FeedPage = () => {
  const navigate = useNavigate();
  const { togglePlay } = usePlayer();
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReposts, setShowReposts] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [history, setHistory] = useState([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportEntity, setReportEntity] = useState({ type: '', id: '' });

  useEffect(() => {
    let mounted = true;
    const loadFeed = async () => {
      try {
        const [items, users, historyData] = await Promise.all([
          serviceLocator.discovery.fetchFeed().catch(() => []),
          serviceLocator.discovery.getSuggestedUsers(9).catch(() => []),
          getListeningHistory().catch(() => ({ history: [] })),
        ]);
        if (mounted) {
          setFeedItems(items || []);
          setSuggestedUsers(users || []);
          setHistory(historyData?.history || historyData || []);
        }
      } catch (error) {
        console.error("fetchFeed error:", error);
      } finally {
        if (mounted) {
          try {
            const cached = JSON.parse(localStorage.getItem('pulsify_followed_cache') || '[]');
            setFollowedUsers(new Set(cached));
          } catch (e) {}
          setLoading(false);
        }
      }
    };
    loadFeed();
    return () => { mounted = false; };
  }, []);

  const filteredItems = showReposts
    ? feedItems
    : feedItems.filter(item => item.type !== 'repost');

  const handlePlayTrack = (track) => {
    if (track && track.trackId) {
      togglePlay({
        trackId: track.trackId,
        title: track.title,
        coverArt: track.coverArt,
        audioUrl: track.audioUrl,
        artist: track.artist,
      });
    }
  };

  // Navigate to track detail page
  const handleGoToTrack = (track) => {
    if (track && track.trackId) {
      navigate(`/tracks/${track.trackId}`);
    }
  };

  // Follow user via backend API
  const handleFollow = async (userId) => {
    try {
      await serviceLocator.discovery.followUser(userId);
      setFollowedUsers(prev => {
        const next = new Set(prev).add(userId);
        localStorage.setItem('pulsify_followed_cache', JSON.stringify([...next]));
        return next;
      });
    } catch (err) {
      if (err?.response?.status === 409) {
        setFollowedUsers(prev => {
          const next = new Set(prev).add(userId);
          localStorage.setItem('pulsify_followed_cache', JSON.stringify([...next]));
          return next;
        });
      } else {
        console.error("Follow failed:", err);
      }
    }
  };

  // Unfollow user
  const handleUnfollow = async (userId) => {
    try {
      await serviceLocator.discovery.unfollowUser(userId);
      setFollowedUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        localStorage.setItem('pulsify_followed_cache', JSON.stringify([...next]));
        return next;
      });
    } catch (err) {
      console.error("Unfollow failed:", err);
    }
  };

  // Navigate to track from history
  const handleGoToHistoryTrack = (track) => {
    const t = track.track_id || track;
    const id = t._id || t.trackId || t.id;
    if (id) navigate(`/tracks/${id}`);
  };

  const renderFeedItem = (item, index) => {
    const isRepost = item.type === 'repost';
    const isAlbumRepost = isRepost && item.entityType === 'album';
    const isPlaylistRepost = isRepost && item.entityType === 'playlist';
    const track = item.track;
    const album = item.album;
    const playlist = item.playlist;
    const artist = item.artist;
    const headerUser = isRepost ? item.repostedBy : artist;
    const headerAction = isRepost
      ? (isAlbumRepost ? 'reposted an album' : isPlaylistRepost ? 'reposted a playlist' : 'reposted a track')
      : 'posted a track';

    return (
      <div className="sc-feed-item-card" key={index} data-testid={`feed-item-${index}`}>
        {/* Header: avatar + "Artist posted a track X days ago" */}
        <div className="sc-feed-item-header">
          <img
            className="sc-feed-header-avatar"
            src={headerUser?.avatarUrl || 'https://via.placeholder.com/28'}
            alt={headerUser?.displayName || headerUser?.username}
            onClick={() => navigate(`/profile/${headerUser?.id}`)}
            style={{ cursor: 'pointer' }}
          />
          <span className="sc-feed-header-text">
            <strong
              className="sc-feed-header-name"
              onClick={() => navigate(`/profile/${headerUser?.id}`)}
            >
              {headerUser?.displayName || headerUser?.username}
            </strong>
            {' '}{headerAction}{' '}{timeAgo(item.createdAt)}
          </span>
        </div>

        {/* Body */}
        {isAlbumRepost || album ? (
          <PulsifyAlbumCard key={album?._id || index} album={album} />
        ) : isPlaylistRepost || item.type === 'playlist' || playlist ? (
          <PulsifyPlaylistCard key={playlist?._id || index} playlist={playlist} />
        ) : track ? (
          <PulsifyTrackCard 
            key={track._id || track.trackId || index} 
            track={{
              ...track,
              id: track.trackId || track._id || track.id,
              coverUrl: track.coverArt || track.artwork_url || 'https://via.placeholder.com/160',
              title: track.title || 'Untitled',
              artistName: artist?.displayName || artist?.username || track.artist?.name || 'Unknown Artist',
              playCount: track.plays || 0,
              likeCount: track.likes || 0
            }}
            onPlayClick={handlePlayTrack}
            onLikeClick={() => console.log("Like clicked")}
            isLiked={false}
          />
        ) : null}
      </div>
    );
  };

  return (
    <div className="sc-feed-page" data-testid="feed-page">
      <div className="sc-feed-content">
        <div className="sc-feed-main">
          {/* Header Row */}
          <div className="sc-feed-header-row">
            <h2 className="sc-page-heading">Hear the latest posts from the people you're following:</h2>
            <div className="sc-reposts-toggle">
              <span>Reposts</span>
              <div
                className={`sc-toggle-switch ${showReposts ? 'sc-toggle-on' : ''}`}
                onClick={() => setShowReposts(!showReposts)}
                data-testid="reposts-toggle"
              >
                <div className="sc-toggle-knob"></div>
              </div>
            </div>
          </div>


          {/* Feed Content */}
          {loading ? (
            <div className="sc-loader" data-testid="feed-loading">
              <div className="sc-loader-bar"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="sc-empty-state">
              <p className="sc-empty-text">
                Your feed is currently empty. Follow some artists to see their tracks and reposts here!
              </p>

              <div className="sc-artists-suggestions-header">
                <span className="sc-artists-title">ARTISTS YOU SHOULD FOLLOW</span>
                <button className="sc-refresh-btn">Refresh list</button>
              </div>

              <div className="sc-artists-list">
                {suggestedUsers.map(user => {
                  const userId = user._id || user.id;
                  const isFollowed = followedUsers.has(userId);
                  return (
                    <div className="sc-artist-row" key={userId}>
                      <div
                        className="sc-artist-avatar-placeholder"
                        style={{ backgroundImage: `url(${user.avatar_url})`, backgroundSize: 'cover', cursor: 'pointer' }}
                        onClick={() => navigate(`/profile/${user._id || user.id}`)}
                      ></div>
                      <div className="sc-artist-details" onClick={() => navigate(`/profile/${user._id || user.id}`)} style={{ cursor: 'pointer' }}>
                        <span className="sc-artist-name">{user.display_name || user.username}</span>
                        <span className="sc-artist-stats">
                          <span className="sc-stat-item">👤 {user.followers_count || 0}</span>
                          <span className="sc-stat-item">🎵 {user.track_count || 0}</span>
                        </span>
                      </div>
                      <button
                        className={`sc-btn sc-btn-follow ${isFollowed ? 'sc-btn-following' : ''}`}
                        onClick={() => isFollowed ? handleUnfollow(userId) : handleFollow(userId)}
                      >
                        {isFollowed ? '✓ Following' : 'Follow'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="sc-feed-items-list" data-testid="feed-list">
              {filteredItems.map((item, i) => renderFeedItem(item, i))}
            </div>
          )}
        </div>

        {/* Right Sidebar — cloned from Discovery page */}
        <aside className="sc-discover-sidebar">
          <ArtistToolsWidget />

          {/* Artists You Should Follow */}
          <div className="sc-sidebar-widget">
            <div className="sc-widget-header">
              <h3>ARTISTS YOU SHOULD FOLLOW</h3>
              <a href="#" className="sc-widget-header-link">Refresh list</a>
            </div>
            <div className="sc-follow-list">
              {suggestedUsers.map((user) => {
                const userId = user._id || user.id;
                const isFollowed = followedUsers.has(userId);
                return (
                  <div className="sc-follow-row" key={userId}>
                    <img
                      className="sc-follow-avatar"
                      src={user.avatar_url || 'https://via.placeholder.com/40'}
                      alt={user.display_name || user.username}
                      onClick={() => navigate(`/profile/${userId}`)}
                    />
                    <div className="sc-follow-info" onClick={() => navigate(`/profile/${userId}`)}>
                      <div className="sc-follow-name">
                        {user.display_name || user.username}
                        {user.is_verified && <span className="sc-verified-dot">●</span>}
                      </div>
                      <div className="sc-follow-stats">
                        👤 {(user.followers_count || 0).toLocaleString()} · 🎵 {user.track_count || 0}
                      </div>
                    </div>
                    <button
                      className={`sc-follow-btn ${isFollowed ? 'sc-follow-btn-following' : ''}`}
                      onClick={() => isFollowed ? handleUnfollow(userId) : handleFollow(userId)}
                    >
                      {isFollowed ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Listening History */}
          <div className="sc-sidebar-widget">
            <div className="sc-widget-header">
              <h3>LISTENING HISTORY</h3>
              <a href="#" className="sc-widget-header-link">View all</a>
            </div>
            <div className="sc-list-items">
              {history.length > 0 ? (
                history.slice(0, 5).map((hist, i) => {
                  const track = hist.track_id || hist;
                  return (
                    <div
                      className="sc-track-mini"
                      key={hist._id || i}
                      onClick={() => handleGoToHistoryTrack(track)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img
                        src={track.artwork_url || track.coverArt || 'https://via.placeholder.com/40'}
                        alt={track.title}
                        className="sc-track-mini-art"
                      />
                      <div className="sc-track-info">
                        <div className="sc-track-uploader">
                          {track.artist_id?.username || track.artist?.name || 'Unknown'}
                        </div>
                        <div className="sc-track-title">{track.title}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: '#888', padding: '10px 0', fontSize: '13px' }}>
                  No listening history available.
                </div>
              )}
            </div>
          </div>

          <div className="sc-sidebar-footer-links">
            <a href="#">Legal</a> · <a href="#">Privacy</a> · <a href="#">Cookie Policy/Imprint</a> · <a href="#">Charts</a> · <a href="#">Newsroom</a>
            <div className="sc-lang" style={{ marginTop: '4px' }}>
              Language: <a href="#">English (US)</a>
            </div>
          </div>
        </aside>
      </div>

      <ReportModal 
        isOpen={reportModalOpen} 
        onClose={() => setReportModalOpen(false)} 
        entityType={reportEntity.type} 
        entityId={reportEntity.id} 
      />
    </div>
  );
};

export default FeedPage;
