// Handcrafted fake data to mimic production backend
export const mockFeedData = [
  {
    trackId: 'pulsify-tr-891',
    title: 'Midnight Syntax',
    artist: { id: 'art-22', name: 'Dr. Loop', avatarUrl: 'https://i.pravatar.cc/150?u=drloop' },
    plays: 1420,
    likes: 340,
    reposts: 12,
    coverArt: 'https://picsum.photos/seed/midnight/400/400',
    durationSeconds: 214,
    uploadedAt: '2 hours ago'
  },
  {
    trackId: 'pulsify-tr-904',
    title: 'Glassmorphic Bass',
    artist: { id: 'art-88', name: 'UI/UX Mafia', avatarUrl: 'https://i.pravatar.cc/150?u=mafia' },
    plays: 8900,
    likes: 1205,
    reposts: 89,
    coverArt: 'https://picsum.photos/seed/glass/400/400',
    durationSeconds: 180,
    uploadedAt: '5 hours ago'
  },
  {
    trackId: 'pulsify-tr-102',
    title: 'Async Await Lullaby',
    artist: { id: 'art-01', name: 'Node Ninja', avatarUrl: 'https://i.pravatar.cc/150?u=ninja' },
    plays: 350,
    likes: 42,
    reposts: 3,
    coverArt: 'https://picsum.photos/seed/code/400/400',
    durationSeconds: 310,
    uploadedAt: '1 day ago'
  }
];

export const mockTrendingData = [
  { rank: 1, ...mockFeedData[1] },
  { rank: 2, ...mockFeedData[0] },
  { rank: 3, ...mockFeedData[2] }
];

export const fetchFeed = async () => {
  return new Promise((resolve) => {
    // simulating network sluggishness
    setTimeout(() => resolve(mockFeedData), 600); 
  });
};

export const fetchTrending = async () => {
  return new Promise((resolve) => setTimeout(() => resolve(mockTrendingData), 450));
};

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
export const likeTrack = async (trackId) => {
  return new Promise(resolve => {
    setTimeout(() => {
      // In a real mock we might toggle a boolean, here we just resolve success
      resolve({ success: true, trackId, action: 'liked' });
    }, 200);
  });
};

export const repostTrack = async (trackId) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, trackId, action: 'reposted' });
    }, 200);
  });
};

export const recordPlay = async (trackId) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, trackId, action: 'played' });
    }, 200);
  });
};

// Resource Resolver: resolve a permalink URL into a resource object
export const resolveUrl = async (permalink) => {
  return new Promise(resolve => {
    setTimeout(() => {
      // Mock resolution: check if link matches a known track
      const match = mockFeedData.find(t =>
        permalink.includes(t.trackId) || permalink.includes(t.title.toLowerCase().replace(/\s+/g, '-'))
      );
      if (match) {
        resolve({ type: 'track', id: match.trackId, data: match, resolved: true });
      } else {
        resolve({ type: 'unknown', id: null, resolved: false });
      }
    }, 200);
  });
};

// Playlists Discovery Mocks
export const discoverPlaylists = async (page = 1, limit = 20) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { _id: 'pl-1', title: 'Favorites', cover_url: 'https://picsum.photos/seed/fav/200/200', track_count: 5 },
        { _id: 'pl-2', title: 'Chill Vibes', cover_url: 'https://picsum.photos/seed/chill/200/200', track_count: 12 }
      ]);
    }, 300);
  });
};

export const searchPlaylists = async (term, page = 1, limit = 20) => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (!term.trim()) return resolve([]);
      resolve([
        { _id: 'pl-1', title: `Favorites - ${term}`, cover_url: 'https://picsum.photos/seed/fav/50/50', track_count: 5 }
      ]);
    }, 200);
  });
};
