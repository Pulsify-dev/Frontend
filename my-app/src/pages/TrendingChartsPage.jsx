import React, { useEffect, useState } from 'react';
import serviceLocator from '../utils/serviceLocator';
import PulsifyTrackRow from '../components/common/PulsifyTrackRow';
import './TrendingChartsPage.css';

// Container component for generating live top charted tracks
const TrendingChartsPage = () => {
  const [trendingData, setTrendingData] = useState([]);
  const [loading, setLoading] = useState(true);

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
                  onPlay={() => console.log('Intercepted play from Trending:', track.title)} 
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
