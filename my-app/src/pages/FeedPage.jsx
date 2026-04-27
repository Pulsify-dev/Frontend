import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../hooks/usePlayer';
import serviceLocator from '../utils/serviceLocator';
import ArtistToolsWidget from '../components/common/ArtistToolsWidget';
import ReportModal from '../components/common/ReportModal';
import { PulsifyPlaylistCard } from '../components/playlists/PulsifyPlaylistCard';
import { PulsifyAlbumCard } from '../components/albums/PulsifyAlbumCard';
import { PulsifyTrackCard } from '../components/discovery/PulsifyTrackCard';
import './FeedPage.css';

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
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportEntity, setReportEntity] = useState({ type: '', id: '' });

  useEffect(() => {
    let mounted = true;
    const loadFeed = async () => {
      try {
        const items = await serviceLocator.discovery.fetchFeed();
        if (mounted) { setFeedItems(items); setLoading(false); }

        // Always load suggested users for the empty state or sidebar
        const users = await serviceLocator.discovery.getSuggestedUsers(9);
        if (mounted) setSuggestedUsers(users);
      } catch (error) {
        console.error("fetchFeed error:", error);
        if (mounted) {
          setLoading(false);
          // Try loading suggested users even if feed fails
          try {
            const users = await serviceLocator.discovery.getSuggestedUsers(9);
            if (mounted) setSuggestedUsers(users);
          } catch (e) { /* ignore */ }
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
      setFollowedUsers(prev => new Set(prev).add(userId));
    } catch (err) {
      if (err?.response?.status === 409) {
        setFollowedUsers(prev => new Set(prev).add(userId));
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
        return next;
      });
    } catch (err) {
      console.error("Unfollow failed:", err);
    }
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

          {/* How the Feed works explainer */}
          <div className="sc-feed-explainer">
            <p>💡 <strong>How your feed works:</strong> Follow artists from the <a href="/discover" className="sc-link-accent">Discover</a> or <a href="/search" className="sc-link-accent">Search</a> page. When they upload new tracks or repost content, it will appear here in your feed automatically.</p>
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

        {/* Right Sidebar */}
        <aside className="sc-feed-sidebar">
          <ArtistToolsWidget />

          <div className="sc-sidebar-section sc-likes-section">
            <div className="sc-sidebar-heading">
              <span>5 LIKES</span>
              <a href="#likes" className="sc-view-all">View all</a>
            </div>
            <div className="sc-like-item">
              <div className="sc-like-art"></div>
              <div className="sc-like-info">
                <span className="sc-like-artist">Someone'</span>
                <span className="sc-like-title">أديني رجعتلك - عمرو دياب 2001</span>
                <span className="sc-like-stats">▶ 44.7M ❤️ 1.01M</span>
              </div>
            </div>
            <div className="sc-like-item">
              <div className="sc-like-art"></div>
              <div className="sc-like-info">
                <span className="sc-like-artist">Roqaiaion2</span>
                <span className="sc-like-title">عمرو دياب - لو كان يرضيك</span>
                <span className="sc-like-stats">▶ 36.5M ❤️ 892K</span>
              </div>
            </div>
          </div>

          <div className="sc-sidebar-section sc-mobile-section">
            <div className="sc-sidebar-heading">
              <span>GO MOBILE</span>
            </div>
            <div className="sc-mobile-badges">
              <button className="sc-app-store-btn">App Store</button>
              <button className="sc-google-play-btn">Google Play</button>
            </div>
          </div>

          <div className="sc-sidebar-footer">
            <div className="sc-footer-links-row">
              <a href="#legal">Legal</a> <span>·</span> <a href="#privacy">Privacy</a> <span>·</span> <a href="#cookie">Cookie Policy</a> <span>·</span> <a href="#cookie-manager">Cookie Manager</a> <span>·</span> <a href="#imprint">Imprint</a> <span>·</span> <a href="#artist-resources">Artist Resources</a> <span>·</span> <a href="#newsroom">Newsroom</a> <span>·</span> <a href="#charts">Charts</a> <span>·</span> <a href="#transparency">Transparency Reports</a>
            </div>
            <div className="sc-footer-lang">Language: <a href="#lang">English (US)</a></div>
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
