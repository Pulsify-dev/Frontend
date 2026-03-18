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

export const searchTracks = async (term) => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (!term.trim()) return resolve([]);
      const lowerTerm = term.toLowerCase();
      const results = [...mockFeedData, ...mockTrendingData].filter(t => 
        t.title.toLowerCase().includes(lowerTerm) || 
        t.artist.name.toLowerCase().includes(lowerTerm)
      );
      // Remove duplicates by trackId
      const unique = Array.from(new Map(results.map(item => [item.trackId, item])).values());
      resolve(unique);
    }, 400); // 400ms network delay
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
