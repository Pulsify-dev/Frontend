/**
 * Authentication Service
 * Handles all API calls related to authentication
 * 
 * Backend API Endpoints:
 * - POST /auth/register - Create new account
 * - POST /auth/login - Login with email/password
 * - POST /auth/verify-email - Verify email with token
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/forgot-password - Request password reset
 * - POST /auth/reset-password - Reset password with token
 * - POST /auth/logout - Logout and invalidate refresh token
 */

// Base URL from env + /v1 prefix (backend adds /v1 to all routes)
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/v1';

/**
 * Helper function for making API requests
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Log request details
  console.log(`[API Request] ${config.method || 'GET'} ${url}`);
  if (options.body) {
    console.log('[API Request Body]', JSON.parse(options.body));
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    // Log response
    console.log(`[API Response] ${response.status} ${response.statusText}`);
    console.log('[API Response Data]', data);

    if (!response.ok) {
      // Handle API error responses
      const error = new Error(data.message || data.error || 'Request failed');
      error.status = response.status;
      error.data = data;
      console.error('[API Error]', error.message, data);
      throw error;
    }

    return data;
  } catch (error) {
    // Re-throw API errors
    if (error.status) {
      throw error;
    }
    // Handle network errors
    console.error('[API Network Error]', error);
    throw new Error('Network error. Please check your connection.');
  }
};

/**
 * Authentication Service Object
 */
export const authService = {
  /**
   * Register a new user account
   * @param {string} username - 6-20 characters, alphanumeric and underscores only
   * @param {string} email - Valid email address
   * @param {string} password - Minimum 8 characters
   * @param {string} captchaToken - reCAPTCHA verification token
   * @returns {Promise<{user_id: string, email: string, username: string, tier: string, message: string}>}
   */
  register: async (username, email, password, captchaToken) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        password,
        captcha_token: captchaToken,
      }),
    });
  },

  /**
   * Login with email and password
   * @param {string} email - Registered email address
   * @param {string} password - Account password
   * @returns {Promise<{access_token: string, refresh_token: string, user: Object}>}
   */
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });
  },

  /**
   * Verify email address using token from verification email
   * @param {string} token - JWT verification token from email
   * @returns {Promise<{message: string}>}
   */
  verifyEmail: async (token) => {
    return apiRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Valid refresh token
   * @returns {Promise<{access_token: string, refresh_token: string}>}
   */
  refreshToken: async (refreshToken) => {
    return apiRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });
  },

  /**
   * Request password reset email
   * @param {string} email - Registered email address
   * @returns {Promise<{message: string}>}
   */
  forgotPassword: async (email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Reset password using token from reset email
   * @param {string} token - Reset token from email
   * @param {string} newPassword - New password (min 8 characters)
   * @returns {Promise<{message: string}>}
   */
  resetPassword: async (token, newPassword) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token,
        new_password: newPassword,
      }),
    });
  },

  /**
   * Logout and invalidate refresh token
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {Promise<{message: string}>}
   */
  logout: async (refreshToken) => {
    return apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });
  },
};

export default authService;
