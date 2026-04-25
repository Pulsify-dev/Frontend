import { pulsifyAxiosInstance } from './api';

const isMock = () => String(import.meta.env.VITE_USE_MOCKS) === 'true';

/* ────────────────────────────────
   Mock Data (aligned to real API shape)
   ──────────────────────────────── */
const mockPlaylists = [
  {
    _id: 'pl-mock-001',
    title: 'Summer Lo-Fi Mix',
    description: 'Chill lo-fi beats for studying and relaxing',
    creator_id: { _id: 'u1', username: 'i_omz', display_name: 'i Omz', avatar_url: '' },
    is_private: false,
    secret_token: null,
    cover_url: 'default-playlist-cover.png',
    track_count: 3,
    duration_ms: 634000,
    permalink: 'summer-lo-fi-mix-abc123',
    tracks: [
      { track_id: { _id: 'trk-1', title: 'lofi chill beat', genre: 'Lo-Fi', artwork_url: '', duration: 215, artist_id: { _id: 'a1', display_name: 'ChillHop' } }, position: 0, added_at: '2026-04-10T10:00:00Z', _id: 'te1' },
      { track_id: { _id: 'trk-2', title: 'rainy afternoon', genre: 'Lo-Fi', artwork_url: '', duration: 198, artist_id: { _id: 'a2', display_name: 'LofiGirl' } }, position: 1, added_at: '2026-04-10T10:01:00Z', _id: 'te2' },
      { track_id: { _id: 'trk-3', title: 'cafe study mix', genre: 'Lo-Fi', artwork_url: '', duration: 221, artist_id: { _id: 'a3', display_name: 'JazzCat' } }, position: 2, added_at: '2026-04-10T10:02:00Z', _id: 'te3' }
    ],
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: '2026-04-15T14:30:00Z'
  },
  {
    _id: 'pl-mock-002',
    title: 'Gym Hardstyle',
    description: 'Hardstyle bangers for the gym',
    creator_id: { _id: 'u1', username: 'i_omz', display_name: 'i Omz', avatar_url: '' },
    is_private: true,
    secret_token: 'mock-secret-token-xyz',
    cover_url: 'default-playlist-cover.png',
    track_count: 2,
    duration_ms: 480000,
    permalink: 'gym-hardstyle-def456',
    tracks: [
      { track_id: { _id: 'trk-4', title: 'Hardstyle Track A', genre: 'Hardstyle', artwork_url: '', duration: 240, artist_id: { _id: 'a4', display_name: 'ZYZZ' } }, position: 0, added_at: '2026-04-12T08:00:00Z', _id: 'te4' },
      { track_id: { _id: 'trk-5', title: 'Hardstyle Track B', genre: 'Hardstyle', artwork_url: '', duration: 240, artist_id: { _id: 'a5', display_name: 'TEVVEZ' } }, position: 1, added_at: '2026-04-12T08:01:00Z', _id: 'te5' }
    ],
    createdAt: '2026-04-12T08:00:00Z',
    updatedAt: '2026-04-18T20:00:00Z'
  }
];

/* ────────────────────────────────
   Service
   ──────────────────────────────── */
export const PulsifyPlaylistService = {

  // ──── CRUD ────

  /** GET /playlists?page=&limit= — Get my playlists */
  async getMyPlaylists(page = 1, limit = 20) {
    if (isMock()) {
      return { success: true, count: mockPlaylists.length, data: mockPlaylists.map(p => ({ ...p })) };
    }
    const { data } = await pulsifyAxiosInstance.get('/playlists', { params: { page, limit } });
    return data;
  },

  /** Backward-compat alias used by PulsifyPlaylistsView */
  async retrieveAllPlaylists() {
    const result = await this.getMyPlaylists();
    return result.data || [];
  },

  /** GET /playlists/:id — Get playlist by ID */
  async getPlaylistById(playlistId, secretToken = null) {
    if (isMock()) {
      const found = mockPlaylists.find(p => p._id === playlistId) || mockPlaylists[0];
      return { success: true, data: { ...found } };
    }
    const params = secretToken ? { token: secretToken } : {};
    const { data } = await pulsifyAxiosInstance.get(`/playlists/${playlistId}`, { params });
    return data;
  },

  /** Backward-compat alias */
  async retrievePlaylistById(playlistId, secretToken = null) {
    const result = await this.getPlaylistById(playlistId, secretToken);
    return result.data || result;
  },

  /** GET /playlists/permalink/:permalink — Get playlist by permalink */
  async getByPermalink(permalink, secretToken = null) {
    if (isMock()) {
      const found = mockPlaylists.find(p => p.permalink === permalink) || mockPlaylists[0];
      return { success: true, data: { ...found } };
    }
    const params = secretToken ? { token: secretToken } : {};
    const { data } = await pulsifyAxiosInstance.get(`/playlists/permalink/${permalink}`, { params });
    return data;
  },

  /** POST /playlists — Create playlist */
  async createPlaylist(payload) {
    if (isMock()) {
      const newPl = {
        _id: 'pl-mock-' + Date.now(),
        title: payload.title,
        description: payload.description || '',
        creator_id: { _id: 'u1', username: 'i_omz', display_name: 'i Omz', avatar_url: '' },
        is_private: payload.is_private || false,
        secret_token: payload.is_private ? 'mock-token-' + Date.now() : null,
        cover_url: payload.file ? URL.createObjectURL(payload.file) : 'default-playlist-cover.png',
        track_count: 0,
        duration_ms: 0,
        permalink: payload.title.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).slice(2, 10),
        tracks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockPlaylists.unshift(newPl);
      return { success: true, data: newPl };
    }

    const formData = new FormData();
    formData.append('title', payload.title);
    
    // Only append description if it's a non-empty string
    if (payload.description && payload.description.trim() !== '') {
      formData.append('description', payload.description);
    }
    
    // Safely parse is_private
    const isPrivateVal = payload.is_private !== undefined ? payload.is_private : false;
    formData.append('is_private', isPrivateVal);

    if (payload.file) {
      formData.append('file', payload.file);
    }

    // When passing FormData, Axios automatically removes the default application/json header
    // and sets multipart/form-data with the correct boundary. We don't need to specify headers.
    const { data } = await pulsifyAxiosInstance.post('/playlists', formData);
    return data;
  },

  /** PATCH /playlists/:id — Update playlist metadata */
  async updatePlaylist(playlistId, payload) {
    if (isMock()) {
      const idx = mockPlaylists.findIndex(p => p._id === playlistId);
      if (idx >= 0) {
        if (payload instanceof FormData) {
          if (payload.has('title')) mockPlaylists[idx].title = payload.get('title');
          if (payload.has('description')) mockPlaylists[idx].description = payload.get('description');
          if (payload.has('is_private')) mockPlaylists[idx].is_private = payload.get('is_private') === 'true';
          if (payload.has('file')) {
            mockPlaylists[idx].cover_url = URL.createObjectURL(payload.get('file'));
          }
        } else {
          Object.assign(mockPlaylists[idx], payload);
        }
        mockPlaylists[idx].updatedAt = new Date().toISOString();
      }
      return { success: true, data: mockPlaylists[idx] || {} };
    }

    const { data } = await pulsifyAxiosInstance.patch(`/playlists/${playlistId}`, payload);
    return data;
  },

  /** DELETE /playlists/:id — Delete playlist */
  async deletePlaylist(playlistId) {
    if (isMock()) {
      const idx = mockPlaylists.findIndex(p => p._id === playlistId);
      if (idx >= 0) mockPlaylists.splice(idx, 1);
      return { success: true, message: 'Playlist deleted successfully' };
    }
    const { data } = await pulsifyAxiosInstance.delete(`/playlists/${playlistId}`);
    return data;
  },

  // ──── TRACK SEQUENCING ────

  /** POST /playlists/:playlistId/tracks/:trackId — Add track to playlist */
  async addTrackToPlaylist(playlistId, trackId) {
    if (isMock()) {
      const pl = mockPlaylists.find(p => p._id === playlistId);
      if (pl) {
        pl.tracks.push({ track_id: trackId, position: pl.tracks.length, added_at: new Date().toISOString(), _id: 'te-' + Date.now() });
        pl.track_count = pl.tracks.length;
      }
      return { success: true, message: 'Track added to playlist', data: pl };
    }
    const { data } = await pulsifyAxiosInstance.post(`/playlists/${playlistId}/tracks/${trackId}`, {});
    return data;
  },

  /** DELETE /playlists/:playlistId/tracks/:trackId — Remove track from playlist */
  async removeTrackFromPlaylist(playlistId, trackId) {
    if (isMock()) {
      const pl = mockPlaylists.find(p => p._id === playlistId);
      if (pl) {
        pl.tracks = pl.tracks.filter(t => (t.track_id._id || t.track_id) !== trackId);
        pl.track_count = pl.tracks.length;
      }
      return { success: true, message: 'Track removed from playlist', data: pl };
    }
    const { data } = await pulsifyAxiosInstance.delete(`/playlists/${playlistId}/tracks/${trackId}`);
    return data;
  },

  /** POST /playlists/:playlistId/reorder — Reorder all tracks */
  async reorderTracks(playlistId, trackOrder) {
    if (isMock()) {
      return { success: true, message: 'Tracks reordered successfully' };
    }
    const { data } = await pulsifyAxiosInstance.post(`/playlists/${playlistId}/reorder`, { track_order: trackOrder });
    return data;
  },

  /** PATCH /playlists/:playlistId/tracks/:trackId/move — Move single track */
  async moveTrack(playlistId, trackId, newPosition) {
    if (isMock()) {
      return { success: true, message: 'Track moved successfully' };
    }
    const { data } = await pulsifyAxiosInstance.patch(`/playlists/${playlistId}/tracks/${trackId}/move`, { new_position: newPosition });
    return data;
  },

  // ──── PRIVACY & SECRET TOKENS ────

  /** PATCH /playlists/:playlistId/privacy — Toggle privacy */
  async togglePrivacy(playlistId, isPrivate) {
    if (isMock()) {
      const pl = mockPlaylists.find(p => p._id === playlistId);
      if (pl) {
        pl.is_private = isPrivate;
        pl.secret_token = isPrivate ? 'mock-token-' + Date.now() : null;
      }
      return { success: true, message: isPrivate ? 'Playlist is now private' : 'Playlist is now public', data: pl };
    }
    const { data } = await pulsifyAxiosInstance.patch(`/playlists/${playlistId}/privacy`, { is_private: isPrivate });
    return data;
  },

  /** POST /playlists/:playlistId/regenerate-token — Regenerate secret token */
  async regenerateToken(playlistId) {
    if (isMock()) {
      const newToken = 'mock-regen-' + Date.now();
      const pl = mockPlaylists.find(p => p._id === playlistId);
      if (pl) pl.secret_token = newToken;
      return { success: true, message: 'Secret token regenerated successfully', data: { playlistId, secret_token: newToken } };
    }
    const { data } = await pulsifyAxiosInstance.post(`/playlists/${playlistId}/regenerate-token`, {});
    return data;
  },

  // ──── EMBED SUPPORT ────

  /** GET /playlists/:playlistId/embed — Get embed iframe code */
  async getEmbedCode(playlistId) {
    if (isMock()) {
      return {
        success: true,
        data: {
          embedCode: `<iframe src="https://pulsify.page/playlists/embed/${playlistId}" width="400" height="600" frameborder="0" allowtransparency="true" allow="autoplay"></iframe>`,
          embedUrl: `https://pulsify.page/playlists/embed/${playlistId}`,
          playlistPermalink: 'mock-playlist'
        }
      };
    }
    const { data } = await pulsifyAxiosInstance.get(`/playlists/${playlistId}/embed`);
    return data;
  },

  /** Backward-compat alias */
  async generateEmbed(playlistId) {
    const result = await this.getEmbedCode(playlistId);
    return result.data || result;
  },

  // ──── DISCOVERY & SEARCH ────

  /** GET /playlists/discover/public — Discover public playlists */
  async discoverPublicPlaylists(page = 1, limit = 20) {
    if (isMock()) {
      const publicOnes = mockPlaylists.filter(p => !p.is_private);
      return { success: true, count: publicOnes.length, data: publicOnes };
    }
    const { data } = await pulsifyAxiosInstance.get('/playlists/discover/public', { params: { page, limit } });
    return data;
  },

  /** GET /playlists/search?q= — Search playlists by title */
  async searchPlaylists(query, page = 1, limit = 20) {
    if (isMock()) {
      const matches = mockPlaylists.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
      return { success: true, count: matches.length, data: matches };
    }
    const { data } = await pulsifyAxiosInstance.get('/playlists/search', { params: { q: query, page, limit } });
    return data;
  },

  // ──── LIKES ────

  /** POST /playlists/:playlistId/like — Like a playlist */
  async likePlaylist(playlistId) {
    if (isMock()) {
      return { success: true, message: 'Playlist liked successfully' };
    }
    const { data } = await pulsifyAxiosInstance.post(`/playlists/${playlistId}/like`);
    return data;
  },

  /** DELETE /playlists/:playlistId/like — Unlike a playlist */
  async unlikePlaylist(playlistId) {
    if (isMock()) {
      return { success: true, message: 'Playlist unliked successfully' };
    }
    const { data } = await pulsifyAxiosInstance.delete(`/playlists/${playlistId}/like`);
    return data;
  }
};
