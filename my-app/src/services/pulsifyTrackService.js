import { pulsifyAxiosInstance } from './api';

const isMock = () => String(import.meta.env.VITE_USE_MOCKS) === 'true';

const GENRE_OPTIONS = [
  'Electronic', 'Hip-Hop', 'Rock', 'Pop', 'Jazz',
  'R&B', 'Classical', 'Country', 'Reggae', 'Metal',
  'Indie', 'Folk', 'Latin', 'Ambient', 'Lo-Fi'
];

let mockTrackStore = [
  {
    _id: 'mock_track_001',
    artist_id: 'mock_artist_01',
    title: 'Summer Vibes',
    permalink: 'summer-vibes-a1b2c3',
    description: 'A chill lo-fi beat for sunny afternoons.',
    genre: 'Lo-Fi',
    tags: ['chill', 'summer', 'vibes'],
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    artwork_url: 'https://placehold.co/400x400/2a1e30/f50?text=♫',
    format: 'mp3',
    duration: 215,
    file_size_bytes: 5242880,
    bitrate: 320000,
    status: 'finished',
    visibility: 'public',
    playback_state: 'playable',
    is_hidden: false,
    play_count: 142,
    like_count: 38,
    repost_count: 7,
    comment_count: 12,
    trending_score: 18.5,
    createdAt: '2026-04-10T14:30:00.000Z',
    updatedAt: '2026-04-10T14:30:00.000Z'
  },
  {
    _id: 'mock_track_002',
    artist_id: 'mock_artist_01',
    title: 'Midnight Drive',
    permalink: 'midnight-drive-d4e5f6',
    description: 'Late night synthwave energy.',
    genre: 'Electronic',
    tags: ['synthwave', 'night', 'driving'],
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    artwork_url: 'https://placehold.co/400x400/1a1a2e/e94560?text=♫',
    format: 'mp3',
    duration: 183,
    file_size_bytes: 4400000,
    bitrate: 320000,
    status: 'finished',
    visibility: 'public',
    playback_state: 'playable',
    is_hidden: false,
    play_count: 89,
    like_count: 22,
    repost_count: 3,
    comment_count: 5,
    trending_score: 10.2,
    createdAt: '2026-04-08T09:15:00.000Z',
    updatedAt: '2026-04-08T09:15:00.000Z'
  },
  {
    _id: 'mock_track_003',
    artist_id: 'mock_artist_01',
    title: 'Rainy Café',
    permalink: 'rainy-cafe-g7h8i9',
    description: 'Jazz-hop for a rainy day.',
    genre: 'Jazz',
    tags: ['jazz', 'rain', 'cafe', 'study'],
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    artwork_url: 'https://placehold.co/400x400/16213e/0f3460?text=♫',
    format: 'wav',
    duration: 247,
    file_size_bytes: 8800000,
    bitrate: 320000,
    status: 'finished',
    visibility: 'private',
    playback_state: 'playable',
    is_hidden: false,
    play_count: 56,
    like_count: 15,
    repost_count: 1,
    comment_count: 3,
    trending_score: 6.8,
    createdAt: '2026-04-05T18:45:00.000Z',
    updatedAt: '2026-04-05T18:45:00.000Z'
  }
];

const mockTranscodingState = {};

const generateMockWaveform = () =>
  Array.from({ length: 200 }, () => parseFloat((Math.random() * 0.8 + 0.2).toFixed(2)));

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const PulsifyTrackService = {

  GENRE_OPTIONS,
  formatDuration,

  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/x-flac', 'audio/x-wav'],
  ALLOWED_AUDIO_EXTENSIONS: ['.mp3', '.wav', '.flac', '.aac'],
  MAX_AUDIO_SIZE_BYTES: 30 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_ARTWORK_SIZE_BYTES: 10 * 1024 * 1024,
  MAX_ARTWORK_UPDATE_SIZE_BYTES: 5 * 1024 * 1024,

  async createTrack(formData, onUploadProgress = null) {
    if (isMock()) {
      if (onUploadProgress) {
        for (let pct = 0; pct <= 100; pct += 10) {
          await new Promise(r => setTimeout(r, 150));
          onUploadProgress({ loaded: pct, total: 100, progress: pct / 100 });
        }
      }

      const newTrack = {
        _id: 'mock_' + Date.now(),
        artist_id: 'mock_artist_01',
        title: formData.get('title') || 'Untitled Track',
        permalink: (formData.get('title') || 'untitled').toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).slice(2, 8),
        description: formData.get('description') || '',
        genre: formData.get('genre') || 'Electronic',
        tags: formData.getAll('tags') || [],
        audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        artwork_url: 'https://placehold.co/400x400/2a1e30/f50?text=♫',
        format: 'mp3',
        duration: Math.floor(Math.random() * 240) + 60,
        file_size_bytes: 5242880,
        bitrate: 320000,
        status: 'processing',
        visibility: 'public',
        playback_state: 'playable',
        is_hidden: false,
        play_count: 0,
        like_count: 0,
        repost_count: 0,
        comment_count: 0,
        trending_score: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockTranscodingState[newTrack._id] = { progress: 0, startedAt: Date.now() };
      mockTrackStore.unshift(newTrack);

      return newTrack;
    }

    const { data } = await pulsifyAxiosInstance.post('/tracks', formData, {
      onUploadProgress
    });
    return data;
  },

  async getTrackById(trackId) {
    if (isMock()) {
      const track = mockTrackStore.find(t => t._id === trackId);
      if (!track) throw new Error('Track not found.');
      return { ...track };
    }
    const { data } = await pulsifyAxiosInstance.get(`/tracks/${trackId}`);
    return data;
  },

  async updateTrackMetadata(trackId, payload) {
    if (isMock()) {
      const idx = mockTrackStore.findIndex(t => t._id === trackId);
      if (idx === -1) throw new Error('Track not found.');
      mockTrackStore[idx] = { ...mockTrackStore[idx], ...payload, updatedAt: new Date().toISOString() };
      return { ...mockTrackStore[idx] };
    }
    const { data } = await pulsifyAxiosInstance.patch(`/tracks/${trackId}`, payload);
    return data;
  },

  async deleteTrack(trackId) {
    if (isMock()) {
      mockTrackStore = mockTrackStore.filter(t => t._id !== trackId);
      return { message: 'Track successfully deleted.' };
    }
    const { data } = await pulsifyAxiosInstance.delete(`/tracks/${trackId}`);
    return data;
  },

  async pollTrackStatus(trackId) {
    if (isMock()) {
      const state = mockTranscodingState[trackId];
      if (!state) {
        return { track_id: trackId, status: 'finished', progress_percent: null, error_message: null };
      }

      state.progress = Math.min(100, state.progress + Math.floor(Math.random() * 20) + 15);

      if (state.progress >= 100) {
        const trackIdx = mockTrackStore.findIndex(t => t._id === trackId);
        if (trackIdx !== -1) {
          mockTrackStore[trackIdx].status = 'finished';
        }
        delete mockTranscodingState[trackId];
        return { track_id: trackId, status: 'finished', progress_percent: null, error_message: null };
      }

      return { track_id: trackId, status: 'processing', progress_percent: state.progress, error_message: null };
    }

    const { data } = await pulsifyAxiosInstance.get(`/tracks/${trackId}/status`);
    return data;
  },

  async getTrackWaveform(trackId) {
    if (isMock()) {
      return {
        track_id: trackId,
        peaks: generateMockWaveform(),
        samples: 200
      };
    }
    const { data } = await pulsifyAxiosInstance.get(`/tracks/${trackId}/waveform`);
    return data;
  },

  async updateTrackArtwork(trackId, file) {
    if (isMock()) {
      const idx = mockTrackStore.findIndex(t => t._id === trackId);
      if (idx === -1) throw new Error('Track not found.');
      const fakeUrl = URL.createObjectURL(file);
      mockTrackStore[idx].artwork_url = fakeUrl;
      return { artwork_url: fakeUrl };
    }

    const formData = new FormData();
    formData.append('file', file);
    const { data } = await pulsifyAxiosInstance.put(`/tracks/${trackId}/artwork`, formData);
    return data;
  },

  async getArtistTracks(artistId = 'me', page = 1, limit = 20) {
    if (isMock()) {
      return {
        tracks: mockTrackStore.map(t => ({ ...t })),
        total: mockTrackStore.length
      };
    }
    const { data } = await pulsifyAxiosInstance.get(`/artists/${artistId}/tracks`, {
      params: { page, limit }
    });
    return data;
  },

  async getLikedTracks(page = 1, limit = 20) {
    if (isMock()) {
      return { success: true, count: 0, data: [] };
    }
    const { data } = await pulsifyAxiosInstance.get('/users/me/likes', { params: { page, limit }});
    return data;
  },

  async likeTrack(trackId) {
    if (isMock()) return { success: true, message: 'Track liked' };
    const { data } = await pulsifyAxiosInstance.post(`/tracks/${trackId}/like`);
    return data;
  },

  async unlikeTrack(trackId) {
    if (isMock()) return { success: true, message: 'Track unliked' };
    const { data } = await pulsifyAxiosInstance.delete(`/tracks/${trackId}/like`);
    return data;
  },

  async checkIfLiked(trackId) {
    if (isMock()) return { liked: false };
    const { data } = await pulsifyAxiosInstance.get(`/tracks/${trackId}/liked`);
    return data;
  },

  validateAudioFile(file) {
    if (!file) return { valid: false, error: 'No audio file selected.' };

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const isValidType = this.ALLOWED_AUDIO_TYPES.includes(file.type) || this.ALLOWED_AUDIO_EXTENSIONS.includes(ext);

    if (!isValidType) {
      return { valid: false, error: `Invalid format "${ext}". Only MP3, WAV, FLAC, and AAC are allowed.` };
    }
    if (file.size > this.MAX_AUDIO_SIZE_BYTES) {
      return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 30MB.` };
    }
    return { valid: true };
  },

  validateArtworkFile(file, isUpdate = false) {
    if (!file) return { valid: false, error: 'No artwork file selected.' };

    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid image. Only JPEG, PNG, and WebP are allowed.' };
    }
    const maxSize = isUpdate ? this.MAX_ARTWORK_UPDATE_SIZE_BYTES : this.MAX_ARTWORK_SIZE_BYTES;
    const maxLabel = isUpdate ? '5MB' : '10MB';
    if (file.size > maxSize) {
      return { valid: false, error: `Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is ${maxLabel}.` };
    }
    return { valid: true };
  }
};
