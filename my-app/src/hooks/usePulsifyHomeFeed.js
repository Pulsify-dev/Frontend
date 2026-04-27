import { useState, useEffect } from 'react';
import homeFeedService from '../services/homeFeedService.js';
import {
  adaptTrackToCard,
  loadTracksByIds,
} from '../services/trackSurfaceService.js';

const normalizeFeedResponse = (payload) => {
  const results = Array.isArray(payload?.results)
    ? payload.results
    : Array.isArray(payload)
      ? payload
      : [];

  return results.map((track) => ({
    id: track.id ?? track.trackId ?? track.track_id,
    title: track.title ?? 'Untitled track',
    artistName:
      track.artistName ??
      track.artist?.name ??
      track.artist ??
      'Unknown artist',
    coverUrl:
      track.coverUrl ??
      track.coverArt ??
      track.cover ??
      '',
    playCount: Number(track.playCount ?? track.plays ?? 0),
    likeCount: Number(track.likeCount ?? track.likes ?? 0),
    repostCount: Number(track.repostCount ?? track.reposts ?? 0),
    commentCount: Number(track.commentCount ?? track.comments ?? 0),
    audioUrl: track.audioUrl ?? track.audio_url ?? '',
    playbackState: track.playbackState ?? track.playback_state ?? 'Playable',
    previewDurationSeconds: Number(
      track.previewDurationSeconds ?? track.preview_duration_seconds ?? 0,
    ),
    durationSeconds: Number(
      track.durationSeconds ?? track.duration ?? track.duration_seconds ?? 0,
    ),
    viewerHasLiked: Boolean(track.viewerHasLiked ?? track.viewer_has_liked),
    viewerHasReposted: Boolean(
      track.viewerHasReposted ?? track.viewer_has_reposted,
    ),
  }));
};

const loadFallbackCards = async () => {
  const tracks = await loadTracksByIds();
  return tracks.map(adaptTrackToCard);
};

export const usePulsifyHomeFeed = (userId) => {
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [recommendedTracks, setRecommendedTracks] = useState([]);
  const [feedTracks, setFeedTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadFeedData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [trending, recommended, feed] = await Promise.all([
          homeFeedService.fetchTrendingTracks(12, 0),
          userId
            ? homeFeedService.fetchRecommendedTracks(userId, 12, 0)
            : Promise.resolve({ results: [] }),
          homeFeedService.fetchFeedTracks(12, 0),
        ]);

        if (!isMounted) return;

        setTrendingTracks(normalizeFeedResponse(trending));
        setRecommendedTracks(normalizeFeedResponse(recommended));
        setFeedTracks(normalizeFeedResponse(feed));
      } catch (err) {
        console.error('Feed loading error:', err);

        try {
          const fallbackTracks = await loadFallbackCards();
          if (!isMounted) return;

          setTrendingTracks(fallbackTracks);
          setRecommendedTracks(fallbackTracks.slice(0, 4));
          setFeedTracks(fallbackTracks);
          setError('Showing the configured live tracks because the feed endpoints are unavailable.');
        } catch (fallbackError) {
          if (!isMounted) return;

          setError(fallbackError.message || err.message || 'Failed to load feed');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFeedData();

    return () => {
      isMounted = false;
    };
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

  const executeSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setQuery(searchQuery);

    try {
      const fallbackCards = await loadFallbackCards();
      const normalizedQuery = searchQuery.trim().toLowerCase();
      setResults(
        fallbackCards.filter((track) =>
          [track.title, track.artistName]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(normalizedQuery),
            ),
        ),
      );
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
