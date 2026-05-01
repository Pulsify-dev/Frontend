import { useState, useCallback, useEffect } from 'react';
import { usePulsifyHomeFeed, usePulsifySearch } from '../hooks/usePulsifyHomeFeed.js';
import { PulsifyTrackCard } from '../components/discovery/PulsifyTrackCard.jsx';
import { PulsifyFeedSection, PulsifyErrorAlert, PulsifyLoadingSpinner } from '../components/discovery/PulsifyFeedSection.jsx';

import { useNavigate } from "react-router-dom";
import serviceLocator from "../utils/serviceLocator";
import { getListeningHistory } from "../services/api";
import ArtistToolsWidget from "../components/common/ArtistToolsWidget";
import ReportModal from "../components/common/ReportModal";

import '../pages/DiscoveryFeedPage.css';
import './HomeFeedPage.css';

export const HomeFeedPage = ({ userId }) => {
  const { trendingTracks, recommendedTracks, feedTracks, isLoading, error } = usePulsifyHomeFeed(userId);
  const { results: searchResults, isSearching, executeSearch } = usePulsifySearch();
  const [likedTracks, setLikedTracks] = useState(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportEntity, setReportEntity] = useState({ type: "", id: "" });

  useEffect(() => {
    const loadSidebarData = async () => {
      try {
        const [historyData, usersData] = await Promise.all([
          getListeningHistory().catch(() => ({ history: [] })),
          serviceLocator.discovery.getSuggestedUsers(5).catch(() => []),
        ]);
        setHistory(historyData?.history || []);
        setSuggestedUsers(usersData || []);
      } catch (err) {
        console.error("Failed to load sidebar data:", err);
      } finally {
        try {
          const cached = JSON.parse(localStorage.getItem('pulsify_followed_cache') || '[]');
          setFollowedUsers(new Set(cached));
        } catch (e) {}
      }
    };
    loadSidebarData();
  }, []);

  const handleFollow = async (userId) => {
    try {
      await serviceLocator.discovery.followUser(userId);
      setFollowedUsers((prev) => {
        const next = new Set(prev).add(userId);
        localStorage.setItem("pulsify_followed_cache", JSON.stringify([...next]));
        return next;
      });
    } catch (err) {
      if (err?.response?.status === 409) {
        setFollowedUsers((prev) => {
          const next = new Set(prev).add(userId);
          localStorage.setItem("pulsify_followed_cache", JSON.stringify([...next]));
          return next;
        });
      } else {
        console.error("Follow failed:", err);
      }
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await serviceLocator.discovery.unfollowUser(userId);
      setFollowedUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        localStorage.setItem("pulsify_followed_cache", JSON.stringify([...next]));
        return next;
      });
    } catch (err) {
      console.error("Unfollow failed:", err);
    }
  };

  const handleGoToTrack = (track) => {
    const t = track.track_id || track;
    const id = t._id || t.trackId || t.id;
    if (id) navigate(`/tracks/${id}`);
  };


  const handlePlayTrack = useCallback((track) => {
    // Dispatch to global player state here
  }, []);

  const handleLikeTrack = useCallback((track) => {
    setLikedTracks(prev => {
      const next = new Set(prev);
      if (next.has(track.id)) {
        next.delete(track.id);
      } else {
        next.add(track.id);
      }
      return next;
    });
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      executeSearch(query);
    }
  };

  if (error && !showSearch) {
    return (
      <div className="pulsify-home-feed sc-discover-page" data-testid="home-feed-page">
        <PulsifyErrorAlert
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="pulsify-home-feed" data-testid="home-feed-page">
      <header className="pulsify-feed-header" data-testid="feed-header">
        <div className="pulsify-search-container">
          <input
            type="text"
            placeholder="Search tracks, artists..."
            className="pulsify-search-input"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            data-testid="search-input"
          />
          <button className="pulsify-search-btn" data-testid="search-btn">
            🔍
          </button>
        </div>
      </header>

      {searchQuery && (
        <div className="pulsify-search-results" data-testid="search-results">
          {isSearching ? (
            <PulsifyLoadingSpinner />
          ) : searchResults.length > 0 ? (
            <section className="pulsify-feed-section">
              <h2>Search Results for "{searchQuery}"</h2>
              <div className="pulsify-track-grid">
                {searchResults.map(track => (
                  <div key={track.id} className="pulsify-grid-item">
                    <PulsifyTrackCard
                      track={track}
                      onPlayClick={handlePlayTrack}
                      onLikeClick={handleLikeTrack}
                      isLiked={likedTracks.has(track.id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <p className="pulsify-no-results">No tracks found for "{searchQuery}"</p>
          )}
        </div>
      )}

      {!searchQuery && (
        <div className="sc-discover-content">
        <main className="pulsify-feed-content sc-discover-main" data-testid="feed-content">
          {isLoading && (
            <div className="pulsify-feed-section">
              <PulsifyLoadingSpinner />
            </div>
          )}

          {trendingTracks.length > 0 && (
            <section className="pulsify-feed-section" data-testid="trending-section">
              <h2>Trending Now</h2>
              <div className="pulsify-track-grid">
                {trendingTracks.map(track => (
                  <div key={track.id} className="pulsify-grid-item">
                    <PulsifyTrackCard
                      track={track}
                      onPlayClick={handlePlayTrack}
                      onLikeClick={handleLikeTrack}
                      isLiked={likedTracks.has(track.id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {recommendedTracks.length > 0 && (
            <section className="pulsify-feed-section" data-testid="recommended-section">
              <h2>Recommended For You</h2>
              <div className="pulsify-track-grid">
                {recommendedTracks.map(track => (
                  <div key={track.id} className="pulsify-grid-item">
                    <PulsifyTrackCard
                      track={track}
                      onPlayClick={handlePlayTrack}
                      onLikeClick={handleLikeTrack}
                      isLiked={likedTracks.has(track.id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {feedTracks.length > 0 && (
            <section className="pulsify-feed-section" data-testid="recent-section">
              <h2>Recent Releases</h2>
              <div className="pulsify-track-grid">
                {feedTracks.map(track => (
                  <div key={track.id} className="pulsify-grid-item">
                    <PulsifyTrackCard
                      track={track}
                      onPlayClick={handlePlayTrack}
                      onLikeClick={handleLikeTrack}
                      isLiked={likedTracks.has(track.id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Right Sidebar cloned from Discovery */}
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
                      src={user.avatar_url || "https://via.placeholder.com/40"}
                      alt={user.display_name || user.username}
                      onClick={() => navigate(`/profile/${userId}`)}
                    />
                    <div
                      className="sc-follow-info"
                      onClick={() => navigate(`/profile/${userId}`)}
                    >
                      <div className="sc-follow-name">
                        {user.display_name || user.username}
                        {user.is_verified && <span className="sc-verified-dot">●</span>}
                      </div>
                      <div className="sc-follow-stats">
                        👤 {(user.followers_count || 0).toLocaleString()} · 🎵 {user.track_count || 0}
                      </div>
                    </div>
                    <button
                      className={`sc-follow-btn ${isFollowed ? "sc-follow-btn-following" : ""}`}
                      onClick={() => isFollowed ? handleUnfollow(userId) : handleFollow(userId)}
                    >
                      {isFollowed ? "Following" : "Follow"}
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
                      onClick={() => handleGoToTrack(track)}
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={track.artwork_url || track.coverArt || "https://via.placeholder.com/40"}
                        alt={track.title}
                        className="sc-track-mini-art"
                      />
                      <div className="sc-track-info">
                        <div className="sc-track-uploader">
                          {track.artist_id?.username || track.artist?.name || "Unknown"}
                        </div>
                        <div className="sc-track-title">{track.title}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: "#888", padding: "10px 0", fontSize: "13px" }}>
                  No listening history available.
                </div>
              )}
            </div>
          </div>

          <div className="sc-sidebar-footer-links">
            <a href="#">Legal</a> · <a href="#">Privacy</a> · <a href="#">Cookie Policy/Imprint</a> · <a href="#">Charts</a> · <a href="#">Newsroom</a>
            <div className="sc-lang" style={{ marginTop: "4px" }}>
              Language: <a href="#">English (US)</a>
            </div>
          </div>
        </aside>
        </div>

      )}
      <ReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} entityType={reportEntity.type} entityId={reportEntity.id} />

    </div>
  );
};

export default HomeFeedPage;
