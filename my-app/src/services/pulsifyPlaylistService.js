import { pulsifyAxiosInstance } from './api';

export const PulsifyPlaylistService = {
  async retrieveAllPlaylists(userId = 'me') {
    if (String(import.meta.env.VITE_USE_MOCKS) === 'true') {
      return [
        { id: '1', title: 'Summer Lo-Fi Mix', is_private: false, track_count: 5 },
        { id: '2', title: 'Gym Hardstyle', is_private: true, track_count: 12 }
      ];
    }
    const { data } = await pulsifyAxiosInstance.get(`/users/${userId}/playlists`);
    return data;
  },

  async retrievePlaylistById(playlistId, secretToken = null) {
    if (String(import.meta.env.VITE_USE_MOCKS) === 'true') {
      return {
        playlist: { id: playlistId, title: 'Gym Hardstyle', is_private: true },
        tracks: [
          { id: 't1', title: 'Hardstyle Track A', artist_name: 'ZYZZ' },
          { id: 't2', title: 'Hardstyle Track B', artist_name: 'TEVVEZ' },
          { id: 't3', title: 'Hardstyle Track C', artist_name: 'TRENCH' }
        ]
      };
    }
    const params = secretToken ? { secret_token: secretToken } : {};
    const { data } = await pulsifyAxiosInstance.get(`/playlists/${playlistId}`, { params });
    return data;
  },

  async createPlaylist(payload) {
    if (String(import.meta.env.VITE_USE_MOCKS) === 'true') {
      return { id: 'mock_' + Date.now(), ...payload };
    }
    const { data } = await pulsifyAxiosInstance.post(`/playlists`, payload);
    return data;
  },

  async deletePlaylist(playlistId) {
    if (String(import.meta.env.VITE_USE_MOCKS) === 'true') {
      return { success: true };
    }
    const { data } = await pulsifyAxiosInstance.delete(`/playlists/${playlistId}`);
    return data;
  },

  async reorderTracks(playlistId, trackIds) {
    if (String(import.meta.env.VITE_USE_MOCKS) === 'true') {
      return { success: true, track_ids: trackIds };
    }
    const { data } = await pulsifyAxiosInstance.put(`/playlists/${playlistId}/tracks/reorder`, { track_ids: trackIds });
    return data;
  },

  async generateEmbed(playlistId) {
    if (String(import.meta.env.VITE_USE_MOCKS) === 'true') {
      return { html: `<iframe src="http://localhost:5173/embed/${playlistId}" width="100%" height="300" frameborder="0"></iframe>` };
    }
    const { data } = await pulsifyAxiosInstance.get(`/playlists/${playlistId}/embed`);
    return data;
  }
};
