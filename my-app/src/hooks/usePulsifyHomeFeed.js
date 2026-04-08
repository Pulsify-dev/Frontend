import { useState, useEffect } from 'react';
import homeFeedService from '../services/homeFeedService.js';
import homeFeedMockService from '../mocks/homeFeedMockService.js';
import { USE_MOCK_SERVICES } from '../utils/constants.js';

const feedService = USE_MOCK_SERVICES ? homeFeedMockService : homeFeedService;

export const usePulsifyHomeFeed = (userId) => {
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [recommendedTracks, setRecommendedTracks] = useState([]);
  const [feedTracks, setFeedTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeedData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [trending, recommended, feed] = await Promise.all([
          feedService.fetchTrendingTracks(12, 0),
          userId ? feedService.fetchRecommendedTracks(userId, 12, 0) : Promise.resolve({ results: [] }),
          feedService.fetchFeedTracks(12, 0),
        ]);

        setTrendingTracks(trending.results || []);
        setRecommendedTracks(recommended.results || []);
        setFeedTracks(feed.results || []);
      } catch (err) {
        setError(err.message || 'Failed to load feed');
        console.error('Feed loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeedData();
  }, [userId]);

  return {
    trendingTracks,
    recommendedTracks,
    feedTracks,
    isLoading,
    error,
  };
};

export const usePulsifySearch = () => {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');

  const executeSearch = async (searchQuery, limit = 20) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setQuery(searchQuery);

    try {
      const data = await feedService.searchTracks(searchQuery, limit, 0);
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return {
    results,
    isSearching,
    query,
    executeSearch,
  };
};
