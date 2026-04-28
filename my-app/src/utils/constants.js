export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const USE_MOCK_SERVICES =
  String(
    import.meta.env.VITE_USE_MOCK ??
      import.meta.env.VITE_USE_MOCKS ??
      import.meta.env.VITE_USE_MOCK_API ??
      'false',
  ).toLowerCase() === 'true';

export const PAGINATION_LIMIT = 12;

export const FEED_SECTIONS = {
  TRENDING: 'trending',
  RECOMMENDED: 'recommended',
  RECENT: 'recent',
};

export const TRACK_SORT_OPTIONS = {
  TRENDING: 'trending',
  NEWEST: 'newest',
  MOST_LIKED: 'most_liked',
  MOST_PLAYED: 'most_played',
};
