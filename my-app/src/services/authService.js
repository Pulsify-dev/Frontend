/**
 * Authentication Service
 * Handles all API calls related to authentication
 *
 * Backend API Endpoints:
 * - POST /auth/register - Create new account
 * - POST /auth/login - Login with email/password
 * - POST /auth/social/:provider - Social login (google, facebook, apple)
 * - POST /auth/verify-email - Verify email with token
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/forgot-password - Request password reset
 * - POST /auth/reset-password - Reset password with token
 * - POST /auth/logout - Logout and invalidate refresh token
 */

// Base URL from env
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/**
 * Helper function for making API requests
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (options.auth !== false) {
    const token = localStorage.getItem("pulsify_access_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const config = {
    ...options,
    headers,
  };

  console.log(`[API Request] ${config.method || "GET"} ${url}`);
  if (options.body) {
    console.log("[API Request Body]", JSON.parse(options.body));
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    console.log(`[API Response] ${response.status} ${response.statusText}`);
    console.log("[API Response Data]", data);

    if (!response.ok) {
      const error = new Error(data.message || data.error || "Request failed");
      error.status = response.status;
      error.data = data;
      console.error("[API Error]", error.message, data);
      throw error;
    }

    return data;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    console.error("[API Network Error]", error);
    throw new Error("Network error. Please check your connection.");
  }
};

/**
 * Authentication Service Object
 */
export const authService = {
  register: async (username, email, password, captchaToken) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username,
        email,
        password,
        captcha_token: captchaToken,
      }),
    });
  },

  login: async (email, password) => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Social Login / Registration
   * @param {string} provider - 'google', 'facebook', or 'apple'
   * @param {string} token - Provider token (JWT or Access Token from the provider's SDK)
   * @returns {Promise<{access_token: string, refresh_token: string, user: Object}>}
   */
  socialLogin: async (provider, token) => {
    return apiRequest(`/auth/social/${provider}`, {
      method: "POST",
      body: JSON.stringify({ token }),
      auth: false,
    });
  },

  verifyEmail: async (token) => {
    return apiRequest("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  refreshToken: async (refreshToken) => {
    return apiRequest("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  forgotPassword: async (email) => {
    return apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token, newPassword) => {
    return apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  },

  logout: async (refreshToken) => {
    return apiRequest("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },
};

export default authService;
