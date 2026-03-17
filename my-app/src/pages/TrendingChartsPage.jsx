import React, { useEffect, useState } from 'react';
import serviceLocator from '../utils/serviceLocator';
import PulsifyTrackRow from '../components/common/PulsifyTrackRow';
import './TrendingChartsPage.css';

// Container component for generating live top charted tracks
const TrendingChartsPage = () => {
  const [trendingData, setTrendingData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Track local active states since we are modifying via DI responses
  const [likedTracks, setLikedTracks] = useState(new Set());
  const [repostedTracks, setRepostedTracks] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    const loadCharts = async () => {
      try {
        const data = await serviceLocator.discovery.fetchTrending();
        if (mounted) {
          setTrendingData(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("DI fetchTrending error:", error);
        if (mounted) setLoading(false);
      }
    };
    loadCharts();
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
    <div className="pulsify-trending-container" data-testid="trending-charts-page">
      <header className="trending-header">
        <h2>Top Charts & Trends</h2>
        <p className="subtitle">The highest velocity streams globally</p>
      </header>

      {loading ? (
        <div className="trending-loader">Compiling global metrics...</div>
      ) : (
        <div className="trending-list" data-testid="trending-list">
          {trendingData.map((track) => (
            <div key={track.trackId} className="trending-rank-wrapper">
              <div className={`rank-badge rank-${track.rank}`}>#{track.rank}</div>
              <div className="rank-track-content">
                <PulsifyTrackRow 
                  track={track} 
                  onLike={handleLike}
                  onRepost={handleRepost}
                  isLiked={likedTracks.has(track.trackId)}
                  isReposted={repostedTracks.has(track.trackId)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingChartsPage;
