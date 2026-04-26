import React, { useEffect, useState } from 'react';
import serviceLocator from '../utils/serviceLocator';
import PulsifyTrackRow from '../components/common/PulsifyTrackRow';
import { usePlayer } from '../hooks/usePlayer';
import './DiscoveryFeedPage.css';

// Container Pattern: SoundCloud "Stream" page
const DiscoveryFeedPage = () => {
  const { setQueueTrackIds } = usePlayer();
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedTracks, setLikedTracks] = useState(new Set());
  const [repostedTracks, setRepostedTracks] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    const loadFeed = async () => {
      try {
        const data = await serviceLocator.discovery.fetchFeed();
        if (mounted) { setFeedData(data); setLoading(false); }
      } catch (error) {
        console.error("DI fetchFeed error:", error);
        if (mounted) setLoading(false);
      }
    };
    loadFeed();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setQueueTrackIds(feedData.map((track) => track.trackId));
  }, [feedData, setQueueTrackIds]);

  const handleLike = async (trackId) => {
    try {
      if (likedTracks.has(trackId)) {
        setLikedTracks(prev => { const n = new Set(prev); n.delete(trackId); return n; });
      } else {
        await serviceLocator.discovery.likeTrack(trackId);
        setLikedTracks(prev => new Set(prev).add(trackId));
      }
    } catch (e) { console.error("Like failed:", e); }
  };

  const handleRepost = async (trackId) => {
    try {
      if (repostedTracks.has(trackId)) {
        setRepostedTracks(prev => { const n = new Set(prev); n.delete(trackId); return n; });
      } else {
        await serviceLocator.discovery.repostTrack(trackId);
        setRepostedTracks(prev => new Set(prev).add(trackId));
      }
    } catch (e) { console.error("Repost failed:", e); }
  };

  return (
    <div className="sc-stream-page" data-testid="discovery-feed-page">
      <div className="sc-stream-content">
        <div className="sc-stream-main">
          <h2 className="sc-page-heading">Stream</h2>
          <p className="sc-page-subtitle">Hear the latest posts from the people you follow</p>

          {loading ? (
            <div className="sc-loader" data-testid="feed-loading">
              <div className="sc-loader-bar"></div>
            </div>
          ) : feedData.length === 0 ? (
            <div className="sc-empty-state">
              <h3>Nothing to hear here</h3>
              <p>Follow artists for updates on sounds they share in the future.</p>
            </div>
          ) : (
            <div className="sc-track-list" data-testid="feed-list">
              {feedData.map(track => (
                <PulsifyTrackRow
                  key={track.trackId}
                  track={track}
                  onLike={handleLike}
                  onRepost={handleRepost}
                  isLiked={likedTracks.has(track.trackId)}
                  isReposted={repostedTracks.has(track.trackId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="sc-stream-sidebar">
          <div className="sc-sidebar-section">
            <div className="sc-sidebar-heading">
              <span>Who to follow</span>
            </div>
            <div className="sc-follow-suggestion">
              <div className="sc-suggest-avatar">🎵</div>
              <div className="sc-suggest-info">
                <span className="sc-suggest-name">Dr. Loop</span>
                <span className="sc-suggest-followers">1,420 followers</span>
              </div>
              <button className="sc-btn">Follow</button>
            </div>
            <div className="sc-follow-suggestion">
              <div className="sc-suggest-avatar">🎧</div>
              <div className="sc-suggest-info">
                <span className="sc-suggest-name">UI/UX Mafia</span>
                <span className="sc-suggest-followers">8,900 followers</span>
              </div>
              <button className="sc-btn">Follow</button>
            </div>
          </div>

          <div className="sc-sidebar-footer">
            <div className="sc-footer-links-row">
              <a href="#legal">Legal</a> · <a href="#privacy">Privacy</a> · <a href="#cookie">Cookie Policy</a>
            </div>
            <div className="sc-footer-links-row">
              <a href="#imprint">Imprint</a> · <a href="#charts">Charts</a> · <a href="#news">Newsroom</a>
            </div>
            <div className="sc-footer-lang">Language: <a href="#lang">English (US)</a></div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DiscoveryFeedPage;
