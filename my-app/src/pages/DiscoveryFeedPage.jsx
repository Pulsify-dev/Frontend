import React, { useEffect, useState } from 'react';
import serviceLocator from '../utils/serviceLocator';
import PulsifyTrackRow from '../components/common/PulsifyTrackRow';
import './DiscoveryFeedPage.css';

// Container Pattern: Handles data fetching, passes props down
const DiscoveryFeedPage = () => {
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Track local active states since we are modifying via DI responses
  const [likedTracks, setLikedTracks] = useState(new Set());
  const [repostedTracks, setRepostedTracks] = useState(new Set());

  // Fetch feed using DI service locator
  useEffect(() => {
    let mounted = true;
    const loadFeed = async () => {
      try {
        const data = await serviceLocator.discovery.fetchFeed();
        if (mounted) {
          setFeedData(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("DI fetchFeed error:", error);
        if (mounted) setLoading(false);
      }
    };
    loadFeed();
    return () => { mounted = false; };
  }, []);

  const handleLike = async (trackId) => {
    try {
      if (likedTracks.has(trackId)) {
        setLikedTracks(prev => { const next = new Set(prev); next.delete(trackId); return next; });
      } else {
        await serviceLocator.discovery.likeTrack(trackId);
        setLikedTracks(prev => new Set(prev).add(trackId));
      }
    } catch (e) {
      console.error("Failed to like:", e);
    }
  };

  const handleRepost = async (trackId) => {
    try {
      if (repostedTracks.has(trackId)) {
        setRepostedTracks(prev => { const next = new Set(prev); next.delete(trackId); return next; });
      } else {
        await serviceLocator.discovery.repostTrack(trackId);
        setRepostedTracks(prev => new Set(prev).add(trackId));
      }
    } catch (e) {
      console.error("Failed to repost:", e);
    }
  };

  return (
    <div className="pulsify-feed-container" data-testid="discovery-feed-page">
      <header className="feed-header">
        <h2>Discovery Feed</h2>
        <p className="subtitle">Fresh algorithms tailored for your ears</p>
      </header>

      {loading ? (
        <div className="feed-loader" data-testid="feed-loading">Loading audio streams...</div>
      ) : (
        <div className="feed-list" data-testid="feed-list">
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
  );
};

export default DiscoveryFeedPage;
