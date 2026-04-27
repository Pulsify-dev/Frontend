import { pulsifyAxiosInstance } from './api';

const isMock = () => String(import.meta.env.VITE_USE_MOCKS) === 'true';

/* ────────────────────────────────
   Mock Data (aligned to real API shape)
   ──────────────────────────────── */
const mockAlbums = [
  {
    _id: 'alb-mock-001',
    artist_id: { _id: 'u1', username: 'i_omz', display_name: 'i Omz', avatar_url: '' },
    title: 'Summer Vibes EP',
    permalink: 'summer-vibes-ep-abc123',
    description: 'A chill EP for the summer',
    genre: 'Electronic',
    type: 'EP',
    release_date: '2026-04-10T10:00:00Z',
    artwork_url: '',
    tracks: [
      { track_id: { _id: 'trk-1', title: 'Intro Beat', genre: 'Electronic', artwork_url: '', duration: 180, artist_id: { _id: 'a1', display_name: 'i Omz' } }, position: 0, _id: 'ate1' },
      { track_id: { _id: 'trk-2', title: 'Main Theme', genre: 'Electronic', artwork_url: '', duration: 240, artist_id: { _id: 'a1', display_name: 'i Omz' } }, position: 1, _id: 'ate2' },
    ],
    track_count: 2,
    total_duration: 420,
    visibility: 'public',
    is_hidden: false,
    play_count: 0,
    like_count: 0,
    repost_count: 0,
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: '2026-04-15T14:30:00Z'
  },
  {
    _id: 'alb-mock-002',
    artist_id: { _id: 'u1', username: 'i_omz', display_name: 'i Omz', avatar_url: '' },
    title: 'Midnight Sessions',
    permalink: 'midnight-sessions-def456',
    description: 'Late night studio recordings',
    genre: 'Hip-hop & Rap',
    type: 'Album',
    release_date: '2026-04-12T08:00:00Z',
    artwork_url: '',
    tracks: [
      { track_id: { _id: 'trk-4', title: 'Night Owl', genre: 'Hip-hop', artwork_url: '', duration: 200, artist_id: { _id: 'a1', display_name: 'i Omz' } }, position: 0, _id: 'ate4' },
      { track_id: { _id: 'trk-5', title: 'After Hours', genre: 'Hip-hop', artwork_url: '', duration: 220, artist_id: { _id: 'a1', display_name: 'i Omz' } }, position: 1, _id: 'ate5' },
    ],
    track_count: 2,
    total_duration: 420,
    visibility: 'private',
    is_hidden: false,
    play_count: 0,
    like_count: 0,
    repost_count: 0,
    createdAt: '2026-04-12T08:00:00Z',
    updatedAt: '2026-04-18T20:00:00Z'
  }
];

/* ────────────────────────────────
   Service
   ──────────────────────────────── */
export const PulsifyAlbumService = {

  // ──── CRUD ────

  /** GET /albums — Get my albums (auth token determines user) */
  async getMyAlbums(page = 1, limit = 20) {
    if (isMock()) {
      return { albums: mockAlbums.map(a => ({ ...a })), total: mockAlbums.length };
    }
    try {
      const { data } = await pulsifyAxiosInstance.get('/albums', { params: { page, limit } });
      console.log('[AlbumService] GET /albums response:', data);
      return data;
    } catch (err) {
      console.error('[AlbumService] GET /albums failed:', err.response?.status, err.response?.data);
      return { albums: [], total: 0 };
    }
  },

  /** Convenience: retrieve all albums as flat array */
  async retrieveAllAlbums() {
    const result = await this.getMyAlbums();
    console.log('[AlbumService] retrieveAllAlbums raw:', result);
    // Backend may wrap in { albums: [...] }, { data: [...] }, or return array directly
    const arr = result.albums || result.data || (Array.isArray(result) ? result : []);
    return arr;
  },

  /** GET /albums/:id — Get album by ID */
  async getAlbumById(albumId) {
    if (isMock()) {
      const found = mockAlbums.find(a => a._id === albumId) || mockAlbums[0];
      return { ...found };
    }
    const { data } = await pulsifyAxiosInstance.get(`/albums/${albumId}`);
    return data;
  },

  /** GET /artists/:artistId/albums — Get albums by artist */
  async getArtistAlbums(artistId, page = 1, limit = 20) {
    if (isMock()) {
      return { albums: mockAlbums.map(a => ({ ...a })), total: mockAlbums.length };
    }
    const { data } = await pulsifyAxiosInstance.get(`/artists/${artistId}/albums`, { params: { page, limit } });
    return data;
  },

  /** POST /albums — Create album (multipart) */
  async createAlbum(payload) {
    if (isMock()) {
      const newAlb = {
        _id: 'alb-mock-' + Date.now(),
        artist_id: { _id: 'u1', username: 'i_omz', display_name: 'i Omz', avatar_url: '' },
        title: payload.title,
        permalink: payload.title.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).slice(2, 10),
        description: payload.description || '',
        genre: payload.genre || 'None',
        type: payload.type || 'Album',
        release_date: new Date().toISOString(),
        artwork_url: payload.artwork ? URL.createObjectURL(payload.artwork) : '',
        tracks: [],
        track_count: 0,
        total_duration: 0,
        visibility: payload.visibility || 'public',
        is_hidden: false,
        play_count: 0,
        like_count: 0,
        repost_count: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockAlbums.unshift(newAlb);
      return newAlb;
    }

    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('genre', payload.genre);
    if (payload.description && payload.description.trim() !== '') {
      formData.append('description', payload.description);
    }
    if (payload.type) formData.append('type', payload.type);
    if (payload.visibility) formData.append('visibility', payload.visibility);
    if (payload.artwork) formData.append('artwork', payload.artwork);
    if (payload.track_ids) {
      formData.append('track_ids', JSON.stringify(payload.track_ids));
    }

    const { data } = await pulsifyAxiosInstance.post('/albums', formData);
    return data;
  },

  /** PATCH /albums/:id — Update album metadata */
  async updateAlbum(albumId, payload) {
    if (isMock()) {
      const idx = mockAlbums.findIndex(a => a._id === albumId);
      if (idx >= 0) {
        Object.assign(mockAlbums[idx], payload);
        mockAlbums[idx].updatedAt = new Date().toISOString();
      }
      return mockAlbums[idx] || {};
    }
    const { data } = await pulsifyAxiosInstance.patch(`/albums/${albumId}`, payload);
    return data;
  },

  /** PUT /albums/:id/artwork — Update album artwork */
  async updateArtwork(albumId, artworkFile) {
    if (isMock()) {
      const idx = mockAlbums.findIndex(a => a._id === albumId);
      if (idx >= 0) {
        mockAlbums[idx].artwork_url = URL.createObjectURL(artworkFile);
      }
      return mockAlbums[idx] || {};
    }
    const formData = new FormData();
    formData.append('artwork', artworkFile);
    const { data } = await pulsifyAxiosInstance.put(`/albums/${albumId}/artwork`, formData);
    return data;
  },

  /** DELETE /albums/:id — Delete album */
  async deleteAlbum(albumId) {
    if (isMock()) {
      const idx = mockAlbums.findIndex(a => a._id === albumId);
      if (idx >= 0) mockAlbums.splice(idx, 1);
      return { message: 'Album deleted successfully.' };
    }
    const { data } = await pulsifyAxiosInstance.delete(`/albums/${albumId}`);
    return data;
  },

  // ──── TRACK MANAGEMENT ────

  /** POST /albums/:id/tracks — Add tracks to album */
  async addTracksToAlbum(albumId, trackIds) {
    if (isMock()) {
      const alb = mockAlbums.find(a => a._id === albumId);
      if (alb) {
        trackIds.forEach((tid, i) => {
          alb.tracks.push({ track_id: tid, position: alb.tracks.length, _id: 'ate-' + Date.now() + i });
        });
        alb.track_count = alb.tracks.length;
      }
      return alb || {};
    }
    const { data } = await pulsifyAxiosInstance.post(`/albums/${albumId}/tracks`, { track_ids: trackIds });
    return data;
  },

  /** DELETE /albums/:id/tracks/:trackId — Remove track from album */
  async removeTrackFromAlbum(albumId, trackId) {
    if (isMock()) {
      const alb = mockAlbums.find(a => a._id === albumId);
      if (alb) {
        alb.tracks = alb.tracks.filter(t => (t.track_id._id || t.track_id) !== trackId);
        alb.track_count = alb.tracks.length;
      }
      return alb || {};
    }
    const { data } = await pulsifyAxiosInstance.delete(`/albums/${albumId}/tracks/${trackId}`);
    return data;
  },

  /** PUT /albums/:id/tracks/order — Reorder tracks */
  async reorderTracks(albumId, orderedIds) {
    if (isMock()) {
      return { message: 'Tracks reordered successfully' };
    }
    const { data } = await pulsifyAxiosInstance.put(`/albums/${albumId}/tracks/order`, { ordered_ids: orderedIds });
    return data;
  },

  // ──── SOCIAL / ENGAGEMENT ────

  /** POST /albums/:id/like — Like an album */
  async likeAlbum(albumId) {
    if (isMock()) return { message: 'Album liked successfully.' };
    const { data } = await pulsifyAxiosInstance.post(`/albums/${albumId}/like`);
    return data;
  },

  /** DELETE /albums/:id/like — Unlike an album */
  async unlikeAlbum(albumId) {
    if (isMock()) return { message: 'Album unliked successfully.' };
    const { data } = await pulsifyAxiosInstance.delete(`/albums/${albumId}/like`);
    return data;
  },

  /** GET /albums/:id/liked — Check if liked */
  async checkIfLiked(albumId) {
    if (isMock()) return { liked: false };
    const { data } = await pulsifyAxiosInstance.get(`/albums/${albumId}/liked`);
    return data;
  }
};
