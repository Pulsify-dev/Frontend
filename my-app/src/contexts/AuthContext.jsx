import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { authService } from "@/services/authService";

/**
 * Auth Context
 * Provides authentication state and methods throughout the app
 * Handles JWT tokens with automatic refresh
 */

const AuthContext = createContext(null);

// Storage keys
const STORAGE_KEYS = {
  USER: "pulsify_user",
  ACCESS_TOKEN: "pulsify_access_token",
  REFRESH_TOKEN: "pulsify_refresh_token",
};

// Token expiration time (15 minutes in milliseconds)
const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000;
// Refresh 1 minute before expiry
const REFRESH_BUFFER = 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef(null);

  /**
   * Clear all auth data from state and storage
   */
  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    // Clear any pending refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  /**
   * Schedule token refresh before expiry
   */
  const scheduleTokenRefresh = useCallback((currentRefreshToken) => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Schedule refresh 1 minute before token expires
    const refreshTime = ACCESS_TOKEN_EXPIRY - REFRESH_BUFFER;
    
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await authService.refreshToken(currentRefreshToken);
        
        // Update tokens
        setAccessToken(response.access_token);
        setRefreshToken(response.refresh_token);
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
        
        // Schedule next refresh
        scheduleTokenRefresh(response.refresh_token);
      } catch (error) {
        console.error("Token refresh failed:", error);
        // Clear auth on refresh failure
        clearAuth();
      }
    }, refreshTime);
  }, [clearAuth]);

  /**
   * Load user from localStorage on mount
   */
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const storedAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (storedUser && storedAccessToken && storedRefreshToken) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        
        // Schedule token refresh
        scheduleTokenRefresh(storedRefreshToken);
      } catch {
        // Invalid data, clear storage
        clearAuth();
      }
    }
    setIsLoading(false);
  }, [scheduleTokenRefresh, clearAuth]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Login - stores user data and tokens
   * @param {Object} userData - User object from login response
   * @param {string} newAccessToken - Access token from login
   * @param {string} newRefreshToken - Refresh token from login
   */
  const login = useCallback((userData, newAccessToken, newRefreshToken) => {
    // Transform user data to consistent format
    const normalizedUser = {
      id: userData.user_id,
      username: userData.username,
      email: userData.email,
      displayName: userData.display_name || userData.username,
      tier: userData.tier || 'Free',
      avatarUrl: userData.avatar_url || null,
      role: userData.tier === 'Pro' ? 'artist' : 'listener',
    };

    setUser(normalizedUser);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser));
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
    
    // Schedule token refresh
    scheduleTokenRefresh(newRefreshToken);
  }, [scheduleTokenRefresh]);

  /**
   * Logout - clears user data and tokens, invalidates refresh token on server
   */
  const logout = useCallback(async () => {
    try {
      // Try to invalidate token on server
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      // Continue with local logout even if server request fails
      console.error("Logout request failed:", error);
    } finally {
      clearAuth();
    }
  }, [refreshToken, clearAuth]);

  /**
   * Update user data
   */
  const updateUser = useCallback((updates) => {
    setUser(prevUser => {
      const updatedUser = { ...prevUser, ...updates };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  /**
   * Get current access token (for API calls)
   * Will attempt to refresh if needed
   */
  const getAccessToken = useCallback(async () => {
    if (!accessToken || !refreshToken) {
      return null;
    }
    return accessToken;
  }, [accessToken, refreshToken]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  /**
   * Check if user is an artist
   */
  const isArtist = useCallback(() => hasRole("artist"), [hasRole]);

  /**
   * Check if user is a listener
   */
  const isListener = useCallback(() => hasRole("listener"), [hasRole]);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user && !!accessToken,
    login,
    logout,
    updateUser,
    getAccessToken,
    hasRole,
    isArtist,
    isListener,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * Access auth context from any component
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
