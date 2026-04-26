import { pulsifyAxiosInstance } from "./api";

const useMock =
  String(
    import.meta.env.VITE_USE_MOCKS ??
      import.meta.env.VITE_USE_MOCK_API ??
      import.meta.env.VITE_USE_MOCK ??
      "false",
  ).toLowerCase() === "true";

const mockPlaylists = [
  {
    id: "1",
    title: "Summer Lo-Fi Mix",
    is_private: false,
    track_count: 5,
    creator_username: "i Omz",
    thumbnail_url:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=300&q=80",
    tracks: [
      { id: "sl1", title: "lofi chill beat", artist_name: "Mayar" },
      { id: "sl2", title: "rainy afternoon", artist_name: "Lina" },
      { id: "sl3", title: "cafe study mix", artist_name: "Nadine" },
      { id: "sl4", title: "moonlight jazz", artist_name: "Salma" },
      { id: "sl5", title: "midnight drive", artist_name: "Basel" },
    ],
  },
  {
    id: "2",
    title: "Gym Hardstyle",
    is_private: true,
    track_count: 3,
    creator_username: "i Omz",
    thumbnail_url:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80",
    tracks: [
      { id: "t1", title: "Hardstyle Track A", artist_name: "ZYZZ" },
      { id: "t2", title: "Hardstyle Track B", artist_name: "TEVVEZ" },
      { id: "t3", title: "Hardstyle Track C", artist_name: "TRENCH" },
    ],
  },
];

const normalizePlaylistTrack = (track = {}) => {
  const trackSource = track.track ?? track.song ?? track.item ?? track;

  return {
    ...trackSource,
    id:
      trackSource.id ??
      trackSource.track_id ??
      trackSource.trackId ??
      track.id ??
      track.track_id ??
      track.trackId ??
      `track-${Date.now()}`,
    title: trackSource.title ?? trackSource.track_title ?? track.title ?? "Untitled track",
    artist_name:
      trackSource.artist_name ??
      trackSource.artist?.name ??
      trackSource.artist ??
      track.artist_name ??
      "Unknown Artist",
    cover_art_url:
      trackSource.cover_art_url ??
      trackSource.cover ??
      trackSource.cover_url ??
      trackSource.thumbnail_url ??
      track.cover_art_url ??
      "",
    duration_seconds:
      trackSource.duration_seconds ??
      trackSource.duration ??
      track.duration_seconds ??
      0,
  };
};

const normalizePlaylist = (playlist = {}) => ({
  id: playlist.id ?? playlist.playlist_id ?? `playlist-${Date.now()}`,
  title: playlist.title ?? playlist.name ?? "Untitled playlist",
  is_private: Boolean(playlist.is_private ?? playlist.isPrivate ?? false),
  track_count:
    playlist.track_count ??
    playlist.trackCount ??
    (Array.isArray(playlist.tracks) ? playlist.tracks.length : 0),
  creator_username:
    playlist.creator_username ??
    playlist.creatorUsername ??
    playlist.user?.username ??
    playlist.owner?.username ??
    "i Omz",
  thumbnail_url:
    playlist.thumbnail_url ??
    playlist.cover_image ??
    playlist.coverUrl ??
    playlist.cover ??
    "",
  tracks: Array.isArray(playlist.tracks) ? playlist.tracks.map(normalizePlaylistTrack) : [],
});

const unwrapPlaylistsPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.playlists)) return payload.playlists;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const buildMockPlaylists = () => mockPlaylists.map(normalizePlaylist);

const buildMockPlaylistById = (playlistId) =>
  buildMockPlaylists().find((playlist) => playlist.id === String(playlistId)) ?? {
    id: String(playlistId),
    title: "Gym Hardstyle",
    is_private: true,
    creator_username: "i Omz",
    thumbnail_url:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80",
    tracks: [
      { id: "t1", title: "Hardstyle Track A", artist_name: "ZYZZ" },
      { id: "t2", title: "Hardstyle Track B", artist_name: "TEVVEZ" },
      { id: "t3", title: "Hardstyle Track C", artist_name: "TRENCH" },
    ],
  };

const shouldFallbackToMock = (error) =>
  !error?.response || error?.response?.status === 404 || error?.response?.status >= 500;

const getFirstSuccessfulResponse = async (paths) => {
  let lastError = null;

  for (const path of paths) {
    try {
      return await pulsifyAxiosInstance.get(path);
    } catch (error) {
      lastError = error;

      if (error?.response?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("Playlist endpoint not found.");
};

export const PulsifyPlaylistService = {
  async retrieveAllPlaylists(userId = "me") {
    if (useMock) {
      return buildMockPlaylists();
    }

    const candidatePaths =
      userId === "me"
        ? ["/playlists", "/users/me/playlists", "/playlists/me"]
        : [`/users/${userId}/playlists`, `/playlists?user_id=${userId}`];

    try {
      const { data } = await getFirstSuccessfulResponse(candidatePaths);
      return unwrapPlaylistsPayload(data).map(normalizePlaylist);
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn("Falling back to mock playlists.", error);
        return buildMockPlaylists();
      }

      throw error;
    }
  },

  async retrievePlaylistById(playlistId, secretToken = null) {
    if (useMock) {
      return buildMockPlaylistById(playlistId);
    }

    const params = secretToken ? { secret_token: secretToken } : {};

    try {
      const { data } = await pulsifyAxiosInstance.get(`/playlists/${playlistId}`, {
        params,
      });
      return normalizePlaylist(data?.data ?? data?.playlist ?? data);
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn("Falling back to mock playlist detail.", error);
        return buildMockPlaylistById(playlistId);
      }

      throw error;
    }
  },

  async createPlaylist(payload) {
    if (useMock) {
      return normalizePlaylist({ id: `mock_${Date.now()}`, ...payload });
    }

    const { data } = await pulsifyAxiosInstance.post(`/playlists`, payload);
    return normalizePlaylist(data);
  },

  async deletePlaylist(playlistId) {
    if (useMock) {
      return { success: true };
    }
    const { data } = await pulsifyAxiosInstance.delete(`/playlists/${playlistId}`);
    return data;
  },

  async reorderTracks(playlistId, trackIds) {
    if (useMock) {
      return { success: true, track_ids: trackIds };
    }
    const { data } = await pulsifyAxiosInstance.put(
      `/playlists/${playlistId}/tracks/reorder`,
      { track_ids: trackIds }
    );
    return data;
  },

  async generateEmbed(playlistId) {
    if (useMock) {
      return {
        html: `<iframe src="http://localhost:5173/embed/${playlistId}" width="100%" height="300" frameborder="0"></iframe>`,
      };
    }
    const { data } = await pulsifyAxiosInstance.get(`/playlists/${playlistId}/embed`);
    return data;
  },
};
