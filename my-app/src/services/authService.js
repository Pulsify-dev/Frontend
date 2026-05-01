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
const AUTH_RATE_LIMIT_STORAGE_KEY = "pulsify_auth_rate_limits_v1";
const DEFAULT_AUTH_RETRY_AFTER_SECONDS = 15 * 60;

const readStoredAuthRateLimits = () => {
  if (typeof window === "undefined") return {};

  try {
    const rawValue = window.localStorage.getItem(AUTH_RATE_LIMIT_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : {};
  } catch {
    return {};
  }
};

const writeStoredAuthRateLimits = (value) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      AUTH_RATE_LIMIT_STORAGE_KEY,
      JSON.stringify(value),
    );
  } catch {
    // Ignore storage write failures so auth requests can continue.
  }
};

const formatRetryAfterLabel = (retryAfterSeconds = 0) => {
  const totalSeconds = Math.max(Math.ceil(Number(retryAfterSeconds) || 0), 0);
  if (!totalSeconds) return "";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (seconds > 0 && hours === 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(" ");
};

const parseRetryAfterSeconds = (response) => {
  const retryAfterHeader = response.headers.get("retry-after");
  if (retryAfterHeader) {
    const numericRetryAfter = Number(retryAfterHeader);
    if (Number.isFinite(numericRetryAfter) && numericRetryAfter > 0) {
      return Math.ceil(numericRetryAfter);
    }

    const retryAfterDate = Date.parse(retryAfterHeader);
    if (Number.isFinite(retryAfterDate)) {
      return Math.max(Math.ceil((retryAfterDate - Date.now()) / 1000), 1);
    }
  }

  const rateLimitResetHeader = response.headers.get("ratelimit-reset");
  const numericRateLimitReset = Number(rateLimitResetHeader);
  if (Number.isFinite(numericRateLimitReset) && numericRateLimitReset > 0) {
    return Math.ceil(numericRateLimitReset);
  }

  return DEFAULT_AUTH_RETRY_AFTER_SECONDS;
};

const normalizeAuthRateLimitRecord = (record) => {
  const expiresAt = Number(record?.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  const retryAfterSeconds = Math.max(
    Math.ceil((expiresAt - Date.now()) / 1000),
    1,
  );

  return {
    expiresAt,
    retryAfterSeconds,
    message:
      typeof record?.message === "string" && record.message.trim()
        ? record.message
        : `Too many requests. Please wait ${formatRetryAfterLabel(
            retryAfterSeconds,
          )} before trying again.`,
  };
};

const clearStoredAuthRateLimit = (endpoint) => {
  const currentState = readStoredAuthRateLimits();
  if (!(endpoint in currentState)) return;

  delete currentState[endpoint];
  writeStoredAuthRateLimits(currentState);
};

const saveStoredAuthRateLimit = (endpoint, record) => {
  const currentState = readStoredAuthRateLimits();
  currentState[endpoint] = record;
  writeStoredAuthRateLimits(currentState);
};

export const getAuthRateLimit = (endpoint) => {
  const currentState = readStoredAuthRateLimits();
  const normalizedRecord = normalizeAuthRateLimitRecord(currentState[endpoint]);

  if (!normalizedRecord && currentState[endpoint]) {
    delete currentState[endpoint];
    writeStoredAuthRateLimits(currentState);
  }

  return normalizedRecord;
};

export const getLoginRateLimit = () => getAuthRateLimit("/auth/login");

const buildRateLimitMessage = (serverMessage, retryAfterSeconds) => {
  const normalizedServerMessage =
    typeof serverMessage === "string" ? serverMessage.trim() : "";
  if (normalizedServerMessage) {
    return normalizedServerMessage;
  }

  return `Too many requests. Please wait ${formatRetryAfterLabel(
    retryAfterSeconds,
  )} before trying again.`;
};

const createStoredRateLimitError = (endpoint, rateLimit) => {
  const error = new Error(rateLimit.message);
  error.status = 429;
  error.data = {
    success: false,
    error: rateLimit.message,
  };
  error.isRateLimited = true;
  error.retryAfterSeconds = rateLimit.retryAfterSeconds;
  error.expiresAt = rateLimit.expiresAt;
  error.endpoint = endpoint;
  return error;
};

const parseResponseBody = async (response) => {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text ? { message: text } : null;
  } catch {
    return null;
  }
};

/**
 * Helper function for making API requests
 */
const apiRequest = async (endpoint, options = {}) => {
  const activeRateLimit = getAuthRateLimit(endpoint);
  if (activeRateLimit) {
    const error = createStoredRateLimitError(endpoint, activeRateLimit);
    console.warn("[API Rate Limited]", error.message, activeRateLimit);
    throw error;
  }

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

  try {
    const response = await fetch(url, config);
    const data = await parseResponseBody(response);

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfterSeconds = parseRetryAfterSeconds(response);
        const expiresAt = Date.now() + retryAfterSeconds * 1000;
        const message = buildRateLimitMessage(
          data?.message || data?.error,
          retryAfterSeconds,
        );

        saveStoredAuthRateLimit(endpoint, {
          expiresAt,
          message,
        });

        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        error.isRateLimited = true;
        error.retryAfterSeconds = retryAfterSeconds;
        error.expiresAt = expiresAt;
        error.endpoint = endpoint;
        console.error("[API Error]", error.message);
        throw error;
      }

      clearStoredAuthRateLimit(endpoint);

      const error = new Error(data?.message || data?.error || "Request failed");
      error.status = response.status;
      error.data = data;
      console.error("[API Error]", error.message);
      throw error;
    }

    clearStoredAuthRateLimit(endpoint);
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

  login: async (email, password, captchaToken) => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        captcha_token: captchaToken,
      }),
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
      auth: false,
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
