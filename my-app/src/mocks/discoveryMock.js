import { trackExperienceMockData } from '../mock/trackExperienceData'

const baseFeedData = ['trk-2026-014', 'trk-2026-011', 'trk-2026-009'].map((trackId, index) => {
  const track = trackExperienceMockData.tracks[trackId]

  return {
    trackId: track.id,
    title: track.title,
    artist: {
      id: `${track.id}-artist`,
      name: track.artist,
      avatarUrl: track.artistAvatar,
    },
    plays: track.playCount,
    likes: track.likeCount,
    reposts: track.repostCount,
    coverArt: track.cover,
    audioUrl: track.audioUrl,
    playbackState: track.playbackState,
    previewDurationSeconds: track.previewDurationSeconds,
    durationSeconds: track.duration,
    uploadedAt: ['2 hours ago', '5 hours ago', '1 day ago'][index] ?? 'Recently',
  }
})

export const mockFeedData = baseFeedData

export const mockTrendingData = [
  { rank: 1, ...mockFeedData[1] },
  { rank: 2, ...mockFeedData[0] },
  { rank: 3, ...mockFeedData[2] },
]

export const fetchFeed = async () =>
  new Promise((resolve) => {
    setTimeout(() => resolve(mockFeedData), 600)
  })

export const fetchTrending = async () =>
  new Promise((resolve) => setTimeout(() => resolve(mockTrendingData), 450))

export const getCharts = async (limit = 50) => {
  return new Promise((resolve) => setTimeout(() => resolve(mockTrendingData.slice(0, limit)), 450));
};

export const searchTracks = async (term, limit = 10, offset = 0) => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (!term.trim()) return resolve({ tracks: [], users: [], playlists: [], albums: [] });
      const lowerTerm = term.toLowerCase();
      const results = [...mockFeedData, ...mockTrendingData].filter(t => 
        t.title.toLowerCase().includes(lowerTerm) || 
        t.artist.name.toLowerCase().includes(lowerTerm)
      );
      // Remove duplicates by trackId
      const uniqueTracks = Array.from(new Map(results.map(item => [item.trackId, item])).values());
      
      resolve({
        tracks: uniqueTracks.slice(offset, offset + limit),
        users: [],
        playlists: [],
        albums: []
      });
    }, 400); // 400ms network delay
  });
};

export const searchSuggestions = async (term, limit = 5) => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (!term.trim()) return resolve({ tracks: [], users: [], playlists: [], albums: [] });
      const lowerTerm = term.toLowerCase();
      const results = [...mockFeedData].filter(t => t.title.toLowerCase().includes(lowerTerm));
      resolve({
        tracks: results.slice(0, limit),
        users: [],
        playlists: [],
        albums: []
      });
    }, 150);
  });
};

// --- New Mutations for Interactive Features ---
export const likeTrack = async (trackId) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, trackId, action: 'liked' })
    }, 200)
  })

export const repostTrack = async (trackId) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, trackId, action: 'reposted' })
    }, 200)
  })

export const recordPlay = async (trackId) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, trackId, action: 'played' })
    }, 200)
  })

export const resolveUrl = async (permalink) =>
  new Promise((resolve) => {
    setTimeout(() => {
      const match = mockFeedData.find(
        (track) =>
          permalink.includes(track.trackId) ||
          permalink.includes(track.title.toLowerCase().replace(/\s+/g, '-')),
      )

      if (match) {
        resolve({ type: 'track', id: match.trackId, data: match, resolved: true })
        return
      }
    }, 200);
  });

// Playlists Discovery Mocks
export const discoverPlaylists = async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { _id: 'pl-1', title: 'Favorites', cover_url: 'https://picsum.photos/seed/fav/200/200', track_count: 5 },
        { _id: 'pl-2', title: 'Chill Vibes', cover_url: 'https://picsum.photos/seed/chill/200/200', track_count: 12 }
      ]);
    }, 300);
  });
};

export const searchPlaylists = async (term) => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (!term.trim()) return resolve([]);
      resolve([
        { _id: 'pl-1', title: `Favorites - ${term}`, cover_url: 'https://picsum.photos/seed/fav/50/50', track_count: 5 }
      ]);
    }, 200);
  });
};
