import React, { useEffect, useState } from 'react';
import serviceLocator from '../utils/serviceLocator';
import PulsifyTrackRow from '../components/common/PulsifyTrackRow';
import './DiscoveryFeedPage.css';

// Container Pattern: Handles data fetching, passes props down
const DiscoveryFeedPage = () => {
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handlePlay = (track) => {
    // Console log simulating integration with global audio player state
    console.log(`Intercepted play event for: ${track.trackId}`);
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
              onPlay={handlePlay} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoveryFeedPage;
