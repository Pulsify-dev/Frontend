import { pulsifyAxiosInstance } from './api';

export const PulsifyPlaylistService = {
  async retrieveAllPlaylists(userId = 'me') {
    const { data } = await pulsifyAxiosInstance.get(`/users/${userId}/playlists`);
    return data;
  },

  async retrievePlaylistById(playlistId, secretToken = null) {
    const params = secretToken ? { secret_token: secretToken } : {};
    const { data } = await pulsifyAxiosInstance.get(`/playlists/${playlistId}`, { params });
    return data;
  },

  async createPlaylist(payload) {
    const { data } = await pulsifyAxiosInstance.post(`/playlists`, payload);
    return data;
  },

  async deletePlaylist(playlistId) {
    const { data } = await pulsifyAxiosInstance.delete(`/playlists/${playlistId}`);
    return data;
  },

  async reorderTracks(playlistId, trackIds) {
    const { data } = await pulsifyAxiosInstance.put(`/playlists/${playlistId}/tracks/reorder`, { track_ids: trackIds });
    return data;
  },

  async generateEmbed(playlistId) {
    const { data } = await pulsifyAxiosInstance.get(`/playlists/${playlistId}/embed`);
    return data;
  }
};
