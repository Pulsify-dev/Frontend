import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../hooks/usePlayer';
import serviceLocator from '../utils/serviceLocator';
import ArtistToolsWidget from '../components/common/ArtistToolsWidget';
import ReportModal from '../components/common/ReportModal';
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
    const track = item.track;
    const artist = item.artist;
    const headerUser = isRepost ? item.repostedBy : artist;
    const headerAction = isRepost
      ? (isAlbumRepost ? 'reposted an album' : 'reposted a track')
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
        {isAlbumRepost ? (
          /* Album Repost Card */
          <div className="sc-feed-album-card" onClick={() => navigate(`/albums/${item.album?._id}`)} style={{ cursor: 'pointer' }}>
            <div className="sc-feed-album-art">
              <img src={item.album?.artwork_url || 'https://via.placeholder.com/150'} alt={item.album?.title} />
            </div>
            <div className="sc-feed-album-info">
              <div className="sc-feed-album-artist">{artist?.displayName || artist?.username}</div>
              <div className="sc-feed-album-title">{item.album?.title}</div>
              <div className="sc-feed-album-meta">{item.album?.track_count || 0} tracks · {item.album?.type || 'Album'}</div>
            </div>
          </div>
        ) : track ? (
          /* Track Card — SoundCloud style */
          <div className="sc-feed-track-card">
            <div className="sc-feed-track-art" onClick={() => handlePlayTrack(track)}>
              <img src={track.coverArt || 'https://via.placeholder.com/160'} alt={track.title} />
              <button className="sc-feed-play-btn" onClick={(e) => { e.stopPropagation(); handlePlayTrack(track); }}>▶</button>
            </div>
            <div className="sc-feed-track-right">
              <div className="sc-feed-track-meta-row">
                <div className="sc-feed-track-names">
                  <span
                    className="sc-feed-track-artist-name"
                    onClick={() => navigate(`/profile/${artist?.id || track.artist?.id}`)}
                  >
                    {artist?.displayName || artist?.username || track.artist?.name}
                  </span>
                  <span className="sc-feed-track-title" onClick={() => handleGoToTrack(track)}>
                    {track.title}
                  </span>
                </div>
                {track.genre && <span className="sc-genre-tag">#{track.genre}</span>}
              </div>

              {/* Waveform placeholder */}
              <div className="sc-waveform-placeholder" onClick={() => handlePlayTrack(track)}>
                <div className="sc-waveform-bars">
                  {Array.from({ length: 80 }).map((_, i) => (
                    <div key={i} className="sc-waveform-bar" style={{ height: `${12 + Math.random() * 28}px` }}></div>
                  ))}
                </div>
                <span className="sc-waveform-duration">{formatDuration(track.durationSeconds)}</span>
              </div>

              {/* Engagement Bar */}
              <div className="sc-engagement-bar">
                <div className="sc-engagement-left">
                  <button className="sc-eng-btn">♥ {track.likes || 0}</button>
                  <button className="sc-eng-btn">⇄ {track.reposts || 0}</button>
                  <button className="sc-eng-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    {' '}Share
                  </button>
                  <button className="sc-eng-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    {' '}Copy Link
                  </button>
                  <button 
                    className="sc-eng-btn" 
                    onClick={(e) => { e.stopPropagation(); setReportEntity({ type: 'Track', id: track.trackId }); setReportModalOpen(true); }}
                  >
                    ⚑ Report
                  </button>
                  <button className="sc-eng-btn sc-eng-btn-more" onClick={() => handleGoToTrack(track)}>More ›</button>
                </div>
                <div className="sc-engagement-right">
                  <span className="sc-eng-stat">▶ {track.plays || 0}</span>
                  <span className="sc-eng-stat">💬 {track.comments || 0}</span>
                </div>
              </div>
            </div>
          </div>
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
