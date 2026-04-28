import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});
apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("pulsify_access_token") ||
    localStorage.getItem("pulsify_jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Adapter to convert backend snake_case to frontend camelCase
const adaptTrack = (track) => ({
  trackId: track._id || track.track_id || track.trackId || track.id,
  title: track.title,
  artist: {
    id: track.artist_id?._id || track.artist_id || track.artist?.id,
    name: track.artist_id?.display_name || track.artist_id?.username || track.artist?.name || track.artist_name,
    username: track.artist_id?.username || track.artist?.username || track.artist_username,
    avatarUrl: track.artist_id?.avatar_url || track.artist?.avatar_url || track.artist?.avatarUrl,
    isVerified: track.artist_id?.is_verified || track.artist?.is_verified,
  },
  plays: track.play_count || track.plays || 0,
  likes: track.like_count || track.likes || 0,
  reposts: track.repost_count || track.reposts || 0,
  comments: track.comment_count || track.comments || 0,
  coverArt: track.artwork_url || track.cover_art || track.coverArt,
  audioUrl: track.audio_url,
  durationSeconds: track.duration || track.duration_seconds || track.durationSeconds,
  uploadedAt: track.createdAt || track.uploaded_at || track.uploadedAt,
  genre: track.genre,
  tags: track.tags || [],
  permalink: track.permalink,
  playbackState: track.playback_state || 'playable',
  trendingScore: track.trending_score || 0,
  rank: track.rank,
  description: track.description,
});

// ──── FEED ────────────────────────────────────────────────
// Backend returns: { success, data: { items: [...], total, page, limit } }
// Each item has type: "track" or type: "repost" with entity_type: "track"|"album"
export const fetchFeed = async (page = 1, limit = 20) => {
  const { data } = await apiClient.get(`/feed?page=${page}&limit=${limit}`);
  const payload = data.data || data;

  // New format: items array with type field
  if (payload.items && Array.isArray(payload.items)) {
    return payload.items.map(item => {
      if (item.type === 'track') {
        return {
          type: 'track',
          createdAt: item.created_at,
          track: adaptTrack(item.track || {}),
          artist: {
            id: item.artist?._id,
            username: item.artist?.username,
            displayName: item.artist?.display_name,
            avatarUrl: item.artist?.avatar_url,
            isVerified: item.artist?.is_verified,
          },
        };
      } else if (item.type === 'repost') {
        const base = {
          type: 'repost',
          entityType: item.entity_type,
          createdAt: item.created_at,
          repostedBy: {
            id: item.reposted_by?._id,
            username: item.reposted_by?.username,
            displayName: item.reposted_by?.display_name,
            avatarUrl: item.reposted_by?.avatar_url,
            isVerified: item.reposted_by?.is_verified,
          },
          artist: {
            id: item.artist?._id,
            username: item.artist?.username,
            displayName: item.artist?.display_name,
            avatarUrl: item.artist?.avatar_url,
            isVerified: item.artist?.is_verified,
          },
        };
        if (item.entity_type === 'track') {
          base.track = adaptTrack(item.track || {});
        } else if (item.entity_type === 'album') {
          base.album = item.album || {};
        }
        return base;
      }
      return item;
    });
  }

  // Legacy flat array fallback
  const items = payload.tracks || payload;
  return Array.isArray(items) ? items.map(t => ({
    type: 'track',
    createdAt: t.createdAt,
    track: adaptTrack(t),
    artist: adaptTrack(t).artist,
  })) : [];
};

// ──── TRENDING & CHARTS ───────────────────────────────────
export const fetchTrending = async (page = 1, limit = 20) => {
  const { data } = await apiClient.get(`/trending?page=${page}&limit=${limit}`);
  const items = data.data?.tracks || data;
  return Array.isArray(items) ? items.map(adaptTrack) : [];
};

export const getCharts = async (limit = 50) => {
  const { data } = await apiClient.get(`/charts?limit=${limit}`);
  const items = data.data?.tracks || data;
  return Array.isArray(items) ? items.map(adaptTrack) : [];
};

// ──── SEARCH ──────────────────────────────────────────────
export const searchTracks = async (term, limit = 10, offset = 0) => {
  const safeTerm = encodeURIComponent(term);
  const { data } = await apiClient.get(`/search?q=${safeTerm}&limit=${limit}&offset=${offset}`);
  const results = data.data || {};

  // Also fetch playlists directly
  let additionalPlaylists = [];
  try {
    const plData = await searchPlaylists(term, 1, limit);
    additionalPlaylists = plData || [];
  } catch (err) {
    console.error("Failed to fetch playlists for search", err);
  }

  // Also fetch users directly
  let additionalUsers = [];
  try {
    const { data: userData } = await apiClient.get(`/users?q=${safeTerm}&page=1&limit=${limit}`);
    additionalUsers = userData.data || [];
  } catch (err) {
    console.error("Failed to fetch users for search", err);
  }

  // Merge playlists uniquely by ID
  const mergedPlaylists = [...(results.playlists || [])];
  additionalPlaylists.forEach(pl => {
    if (!mergedPlaylists.find(p => (p._id || p.id) === (pl._id || pl.id))) {
      mergedPlaylists.push(pl);
    }
  });

  // Merge users uniquely by ID
  const mergedUsers = [...(results.users || [])];
  additionalUsers.forEach(u => {
    if (!mergedUsers.find(mu => (mu._id || mu.id) === (u._id || u.id))) {
      mergedUsers.push(u);
    }
  });

  return {
    tracks: Array.isArray(results.tracks) ? results.tracks.map(adaptTrack) : [],
    users: mergedUsers,
    playlists: mergedPlaylists,
    albums: results.albums || []
  };
};

export const searchSuggestions = async (term, limit = 5) => {
  const safeTerm = encodeURIComponent(term);
  const { data } = await apiClient.get(`/search/suggestions?q=${safeTerm}&limit=${limit}`);
  const results = data.data || {};
  return {
    tracks: results.tracks || [],
    users: results.users || [],
    playlists: results.playlists || [],
    albums: results.albums || []
  };
};

// ──── ENGAGEMENT ──────────────────────────────────────────
export const likeTrack = async (trackId) => {
  const { data } = await apiClient.post(`/tracks/${trackId}/like`);
  return data;
};

export const repostTrack = async (trackId) => {
  const { data } = await apiClient.post(`/tracks/${trackId}/repost`);
  return data;
};

export const recordPlay = async (trackId) => {
  const { data } = await apiClient.post(`/tracks/${trackId}/play`);
  return data;
};

// ──── RESOURCE RESOLVER ───────────────────────────────────
export const resolveUrl = async (permalink) => {
  const safeUrl = encodeURIComponent(permalink);
  const { data } = await apiClient.get(`/resolve?url=${safeUrl}`);
  return data;
};

// Global search across tracks, users, playlists, and albums
export const searchGlobal = async (term, limit = 10, offset = 0) => {
  const safeTerm = encodeURIComponent(term);
  const { data } = await apiClient.get(`/search?q=${safeTerm}&limit=${limit}&offset=${offset}`);
  return data;
};

// Trending tracks
export const getTrendingTracks = async (page = 1, limit = 20, genre = null) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (genre) params.append("genre", genre);
  const { data } = await apiClient.get(`/trending?${params.toString()}`);
  return data;
};

// Personal feed (requires authentication)
export const getPersonalFeed = async (page = 1, limit = 20) => {
  const { data } = await apiClient.get(`/feed?page=${page}&limit=${limit}`);
  return data;
};

// Get user's playlists
export const getMyPlaylists = async (limit = 10) => {
  const { data } = await apiClient.get(`/playlists?limit=${limit}`);
  return data?.data?.playlists ?? data ?? [];
};
// ──── PLAYLISTS DISCOVERY ─────────────────────────────────
export const discoverPlaylists = async (page = 1, limit = 20) => {
  try {
    const { data } = await apiClient.get(`/playlists/discover/public?page=${page}&limit=${limit}`);
    return data?.data || [];
  } catch (err) {
    console.error("discoverPlaylists error:", err);
    return [];
  }
};

export const searchPlaylists = async (term, page = 1, limit = 20) => {
  try {
    const safeTerm = encodeURIComponent(term);
    const { data } = await apiClient.get(`/playlists/search?q=${safeTerm}&page=${page}&limit=${limit}`);
    return data?.data || [];
  } catch (err) {
    console.error("searchPlaylists error:", err);
    return [];
  }
};

// ──── USERS ───────────────────────────────────────────────
export const getSuggestedUsers = async (limit = 9) => {
  try {
    const { data } = await apiClient.get(`/users?page=1&limit=${limit}`);
    return data?.data || [];
  } catch (err) {
    console.error("getSuggestedUsers error:", err);
    return [];
  }
};

// ──── RECENTLY PLAYED ─────────────────────────────────────
export const getRecentlyPlayed = async (page = 1, limit = 10) => {
  try {
    const { data } = await apiClient.get(`/users/me/recently-played?page=${page}&limit=${limit}`);
    return data?.data?.history || data?.history || data?.data || [];
  } catch (err) {
    console.error("getRecentlyPlayed error:", err);
    return [];
  }
};

// ──── ALBUMS ──────────────────────────────────────────────
export const getAlbumById = async (albumId) => {
  try {
    const { data } = await apiClient.get(`/albums/${albumId}`);
    return data;
  } catch (err) {
    console.error("getAlbumById error:", err);
    return null;
  }
};

// ──── SOCIAL: FOLLOW / UNFOLLOW ───────────────────────────
export const followUser = async (userId) => {
  const { data } = await apiClient.post(`/users/${userId}/follow`);
  return data;
};

export const unfollowUser = async (userId) => {
  const { data } = await apiClient.delete(`/users/${userId}/follow`);
  return data;
};
