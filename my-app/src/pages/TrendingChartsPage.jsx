import React, { useEffect, useState } from 'react';
import serviceLocator from '../utils/serviceLocator';
import PulsifyTrackRow from '../components/common/PulsifyTrackRow';
import './TrendingChartsPage.css';

const GENRE_TABS = ['All music genres', 'Electronic', 'Hip-hop & Rap', 'Pop', 'R&B & Soul', 'Rock', 'Classical'];

const CHART_CATEGORIES = [
  { id: 'top50-all', title: 'Top 50', genre: 'All Genres', type: 'Music Charts', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { id: 'new-hot-all', title: 'New & Hot', genre: 'All Genres', type: 'Music Charts', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { id: 'top50-electronic', title: 'Top 50', genre: 'Electronic', type: 'Music Charts', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { id: 'new-hot-electronic', title: 'New & Hot', genre: 'Electronic', type: 'Music Charts', cover: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { id: 'top50-hiphop', title: 'Top 50', genre: 'Hip Hop', type: 'Music Charts', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
];

const TrendingChartsPage = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [activeChart, setActiveChart] = useState(null);
  
  const [trendingData, setTrendingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeGenre, setActiveGenre] = useState('All music genres');
  const [likedTracks, setLikedTracks] = useState(new Set());
  const [repostedTracks, setRepostedTracks] = useState(new Set());

  // Load tracks when entering list view
  useEffect(() => {
    if (viewMode === 'list') {
      let mounted = true;
      setLoading(true);
      const loadCharts = async () => {
        try {
          const data = await serviceLocator.discovery.getCharts(50);
          if (mounted) { setTrendingData(data); setLoading(false); }
        } catch (error) {
          console.error("DI getCharts error:", error);
          if (mounted) setLoading(false);
        }
      };
      loadCharts();
      return () => { mounted = false; };
    }
  }, [viewMode]);

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

  const handleChartClick = (chart) => {
    setActiveChart(chart);
    setActiveGenre(chart.genre === 'All Genres' ? 'All music genres' : chart.genre);
    setViewMode('list');
  };

  return (
    <div className="sc-charts-page" data-testid="trending-charts-page">
      <div className="sc-charts-main-content">
        {viewMode === 'grid' ? (
          <div className="sc-charts-grid-view">
            <h2 className="sc-page-heading">Charts</h2>
            <p className="sc-page-subtitle">The most played tracks on Pulsify this week</p>

            <div className="sc-chart-section">
              <h3 className="sc-section-heading">Music Charts Global</h3>
              <div className="sc-chart-card-grid">
                {CHART_CATEGORIES.map(chart => (
                  <div key={chart.id} className="sc-chart-card" onClick={() => handleChartClick(chart)}>
                    <div className="sc-chart-card-art">
                      <img src={chart.cover} alt={chart.title} />
                      <div className="sc-chart-card-overlay">
                        <div className="sc-chart-card-title">{chart.title}</div>
                        <div className="sc-chart-card-genre">{chart.genre}</div>
                      </div>
                    </div>
                    <div className="sc-chart-card-info">
                      <div className="sc-chart-card-primary">{chart.title} {chart.genre}</div>
                      <div className="sc-chart-card-secondary">{chart.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="sc-chart-section" style={{ marginTop: '40px' }}>
              <h3 className="sc-section-heading">New & Hot</h3>
              <p className="sc-page-subtitle" style={{marginBottom: '16px'}}>Up-and-coming tracks on Pulsify</p>
              <div className="sc-chart-card-grid">
                 {CHART_CATEGORIES.slice().reverse().map(chart => (
                  <div key={`${chart.id}-hot`} className="sc-chart-card" onClick={() => handleChartClick(chart)}>
                    <div className="sc-chart-card-art">
                      <img src={chart.cover} alt={chart.title} style={{ filter: 'hue-rotate(90deg)' }} />
                      <div className="sc-chart-card-overlay">
                        <div className="sc-chart-card-title">New & Hot</div>
                        <div className="sc-chart-card-genre">{chart.genre}</div>
                      </div>
                    </div>
                    <div className="sc-chart-card-info">
                      <div className="sc-chart-card-primary">New & Hot {chart.genre}</div>
                      <div className="sc-chart-card-secondary">{chart.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="sc-charts-list-view">
            <div className="sc-list-view-header">
              <button className="sc-back-btn" onClick={() => setViewMode('grid')}>
                ← Back to Charts
              </button>
              <h2 className="sc-page-heading" style={{ marginTop: '16px' }}>
                {activeChart ? `${activeChart.title} - ${activeChart.genre}` : 'Charts: Top 50'}
              </h2>
            </div>
            
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
                        hideContext={true}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Right Sidebar mimicking SoundCloud */}
      <div className="sc-charts-sidebar">
        <div className="sc-sidebar-section">
          <div className="sc-sidebar-header">
            <h4>ARTIST TOOLS</h4>
            <span className="sc-sidebar-arrow">⌄</span>
          </div>
          <div className="sc-artist-tools-grid">
            <div className="sc-artist-tool"><div className="sc-tool-icon">⚡</div>Amplify</div>
            <div className="sc-artist-tool"><div className="sc-tool-icon">🔄</div>Replace</div>
            <div className="sc-artist-tool"><div className="sc-tool-icon">🌐</div>Distribute</div>
            <div className="sc-artist-tool"><div className="sc-tool-icon">🎚️</div>Master</div>
          </div>
          <button className="sc-artist-pro-btn">★ Unlock Artist tools from EGP 29.99/month</button>
        </div>
        
        <div className="sc-sidebar-section">
          <div className="sc-sidebar-header">
            <h4>ARTISTS YOU SHOULD FOLLOW</h4>
            <span className="sc-refresh-list">Refresh list</span>
          </div>
          <div className="sc-suggested-artist">
            <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60" alt="Milzy" className="sc-suggested-avatar" />
            <div className="sc-suggested-info">
              <span className="sc-suggested-name">Milzy ✔</span>
              <span className="sc-suggested-stats">👥 1,275 🎵 6</span>
            </div>
            <button className="sc-follow-btn">Follow</button>
          </div>
          <div className="sc-suggested-artist">
            <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&auto=format&fit=crop&q=60" alt="Jouno" className="sc-suggested-avatar" />
            <div className="sc-suggested-info">
              <span className="sc-suggested-name">Jouno</span>
              <span className="sc-suggested-stats">👥 133 🎵 6</span>
            </div>
            <button className="sc-follow-btn">Follow</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingChartsPage;
