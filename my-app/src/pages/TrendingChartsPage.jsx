import React, { useEffect, useState } from 'react';
import serviceLocator from '../utils/serviceLocator';
import PulsifyTrackRow from '../components/common/PulsifyTrackRow';
import './TrendingChartsPage.css';

const GENRE_TABS = ['All music genres', 'Electronic', 'Hip-hop & Rap', 'Pop', 'R&B & Soul', 'Rock', 'Classical'];

const TrendingChartsPage = () => {
  const [trendingData, setTrendingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState('All music genres');
  const [likedTracks, setLikedTracks] = useState(new Set());
  const [repostedTracks, setRepostedTracks] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    const loadCharts = async () => {
      try {
        const data = await serviceLocator.discovery.fetchTrending();
        if (mounted) { setTrendingData(data); setLoading(false); }
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
    <div className="sc-charts-page" data-testid="trending-charts-page">
      <h2 className="sc-page-heading">Charts: Top 50</h2>
      <p className="sc-page-subtitle">The most played tracks on Pulsify this week</p>

      {/* Genre Tabs */}
      <div className="sc-genre-tabs">
        {GENRE_TABS.map(genre => (
          <button
            key={genre}
            className={`sc-genre-tab ${activeGenre === genre ? 'active' : ''}`}
            onClick={() => setActiveGenre(genre)}
          >
            {genre}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="sc-loader"><div className="sc-loader-bar"></div></div>
      ) : (
        <div className="sc-chart-list" data-testid="trending-list">
          {trendingData.map((track, index) => (
            <div key={track.trackId} className="sc-chart-entry">
              <div className="sc-chart-rank">
                <span className="sc-rank-number">{track.rank || index + 1}</span>
              </div>
              <div className="sc-chart-track">
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
