import { API_BASE_URL } from '../utils/constants.js';
import { transformSnakeToCamel } from '../utils/dataTransformers.js';

class HomeFeedService {
  async fetchTrendingTracks(limit = 12, offset = 0) {
    const response = await fetch(
      `${API_BASE_URL}/tracks/?trending=true&limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch trending tracks: ${response.statusText}`);
    }

    const data = await response.json();
    return transformSnakeToCamel(data);
  }

  async fetchRecommendedTracks(userId, limit = 12, offset = 0) {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/recommendations/?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
    }

    const data = await response.json();
    return transformSnakeToCamel(data);
  }

  async fetchFeedTracks(limit = 12, offset = 0) {
    const response = await fetch(
      `${API_BASE_URL}/feed/?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.statusText}`);
    }

    const data = await response.json();
    return transformSnakeToCamel(data);
  }

  async fetchChartTracks(chartType = 'weekly', limit = 12) {
    const response = await fetch(
      `${API_BASE_URL}/charts/${chartType}/?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch chart tracks: ${response.statusText}`);
    }

    const data = await response.json();
    return transformSnakeToCamel(data);
  }

  async searchTracks(query, limit = 20, offset = 0) {
    const response = await fetch(
      `${API_BASE_URL}/search/tracks/?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error(`Failed to search tracks: ${response.statusText}`);
    }

    const data = await response.json();
    return transformSnakeToCamel(data);
  }
}

export default new HomeFeedService();
