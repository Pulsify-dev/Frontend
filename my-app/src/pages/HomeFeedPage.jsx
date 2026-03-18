import { useState, useCallback } from 'react';
import { usePulsifyHomeFeed, usePulsifySearch } from '../hooks/usePulsifyHomeFeed.js';
import { PulsifyTrackCard } from '../components/discovery/PulsifyTrackCard.jsx';
import { PulsifyFeedSection, PulsifyErrorAlert, PulsifyLoadingSpinner } from '../components/discovery/PulsifyFeedSection.jsx';
import './HomeFeedPage.css';

export const HomeFeedPage = ({ userId }) => {
  const { trendingTracks, recommendedTracks, feedTracks, isLoading, error } = usePulsifyHomeFeed(userId);
  const { results: searchResults, isSearching, executeSearch } = usePulsifySearch();
  const [likedTracks, setLikedTracks] = useState(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePlayTrack = useCallback((track) => {
    console.log('Playing track:', track.title);
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
      <div className="pulsify-home-feed" data-testid="home-feed-page">
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
        <main className="pulsify-feed-content" data-testid="feed-content">
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
      )}
    </div>
  );
};

export default HomeFeedPage;
