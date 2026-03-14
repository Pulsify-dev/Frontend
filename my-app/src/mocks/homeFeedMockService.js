// Mock service for front-end development without backend
const createMockTrack = (id, title, artistName) => ({
  id,
  title,
  artistName,
  artistId: Math.floor(Math.random() * 1000),
  duration: Math.floor(Math.random() * 360) + 60,
  playCount: Math.floor(Math.random() * 50000),
  likeCount: Math.floor(Math.random() * 5000),
  coverUrl: `https://via.placeholder.com/300?text=${encodeURIComponent(title)}`,
  streamUrl: '#',
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  isLiked: Math.random() > 0.7,
});

const mockTrendingTracks = [
  createMockTrack(1, 'Neon Nights', 'Luna Echo'),
  createMockTrack(2, 'Digital Dreams', 'Synthwave Prophet'),
  createMockTrack(3, 'Cosmic Pulse', 'Stellar Winds'),
  createMockTrack(4, 'Urban Rhythm', 'City Beats'),
  createMockTrack(5, 'Melodic Journey', 'Wave Runner'),
  createMockTrack(6, 'Electric Soul', 'Pulse Master'),
  createMockTrack(7, 'Chrome Elegance', 'Future Sounds'),
  createMockTrack(8, 'Velvet Horizon', 'Ambient Soul'),
  createMockTrack(9, 'Quantum Bliss', 'Sonic Pioneer'),
  createMockTrack(10, 'Infinite Loop', 'Echo Chamber'),
  createMockTrack(11, 'Transcend Motion', 'Velocity Rush'),
  createMockTrack(12, 'Lumina Rising', 'Ascending Tones'),
];

class HomeFeedMockService {
  async fetchTrendingTracks(limit = 12, offset = 0) {
    await new Promise(r => setTimeout(r, 500));
    return {
      results: mockTrendingTracks.slice(offset, offset + limit),
      count: mockTrendingTracks.length,
      offset,
    };
  }

  async fetchRecommendedTracks(userId, limit = 12, offset = 0) {
    await new Promise(r => setTimeout(r, 500));
    const shuffled = [...mockTrendingTracks].sort(() => Math.random() - 0.5);
    return {
      results: shuffled.slice(offset, offset + limit),
      count: shuffled.length,
      offset,
    };
  }

  async fetchFeedTracks(limit = 12, offset = 0) {
    await new Promise(r => setTimeout(r, 500));
    const mixed = [...mockTrendingTracks, ...mockTrendingTracks].slice(0, 20);
    return {
      results: mixed.slice(offset, offset + limit),
      count: mixed.length,
      offset,
    };
  }

  async fetchChartTracks(chartType = 'weekly', limit = 12) {
    await new Promise(r => setTimeout(r, 500));
    return {
      results: mockTrendingTracks.slice(0, limit),
      chartType,
    };
  }

  async searchTracks(query, limit = 20, offset = 0) {
    await new Promise(r => setTimeout(r, 500));
    const filtered = mockTrendingTracks.filter(t =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.artistName.toLowerCase().includes(query.toLowerCase())
    );
    return {
      results: filtered.slice(offset, offset + limit),
      count: filtered.length,
      query,
      offset,
    };
  }
}

export default new HomeFeedMockService();
