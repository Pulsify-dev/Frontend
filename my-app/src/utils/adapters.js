/**
 * Utility functions to convert between snake_case (API) and camelCase (Frontend)
 * Backend APIs return JSON data in snake_case, while we use camelCase in the frontend.
 */

/**
 * Converts a snake_case string to camelCase
 * @param {string} str - The snake_case string
 * @returns {string} - The camelCase string
 */
export const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Converts a camelCase string to snake_case
 * @param {string} str - The camelCase string
 * @returns {string} - The snake_case string
 */
export const camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Recursively converts all keys in an object from snake_case to camelCase
 * @param {Object} obj - The object with snake_case keys
 * @returns {Object} - The object with camelCase keys
 */
export const adaptFromApi = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(adaptFromApi);
  }

  if (typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = snakeToCamel(key);
      acc[camelKey] = adaptFromApi(obj[key]);
      return acc;
    }, {});
  }

  return obj;
};

/**
 * Recursively converts all keys in an object from camelCase to snake_case
 * @param {Object} obj - The object with camelCase keys
 * @returns {Object} - The object with snake_case keys
 */
export const adaptToApi = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(adaptToApi);
  }

  if (typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = camelToSnake(key);
      acc[snakeKey] = adaptToApi(obj[key]);
      return acc;
    }, {});
  }

  return obj;
};

/**
 * Adapts a user object from API response to frontend format
 * @param {Object} data - The user data from API (snake_case)
 * @returns {Object} - The user data for frontend (camelCase)
 */
export const adaptUserFromApi = (data) => ({
  id: data.id,
  username: data.username,
  displayName: data.display_name,
  email: data.email,
  bio: data.bio,
  avatarUrl: data.avatar_url,
  headerUrl: data.header_url,
  role: data.role, // 'artist' | 'listener'
  followersCount: data.followers_count,
  followingCount: data.following_count,
  tracksCount: data.tracks_count,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  city: data.city,
  country: data.country,
  isVerified: data.is_verified,
});

/**
 * Adapts a user object from frontend format to API request
 * @param {Object} data - The user data from frontend (camelCase)
 * @returns {Object} - The user data for API (snake_case)
 */
export const adaptUserToApi = (data) => ({
  id: data.id,
  username: data.username,
  display_name: data.displayName,
  email: data.email,
  bio: data.bio,
  avatar_url: data.avatarUrl,
  header_url: data.headerUrl,
  role: data.role,
  city: data.city,
  country: data.country,
});
