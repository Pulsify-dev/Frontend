/**
 * Mock Service
 * Simple mock API for testing auth pages without real backend
 */

import { mockUsers } from "./data";

// Simulate network delay
const delay = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock Login
 * Simulates a login request - accepts any email for demo purposes
 */
export const mockLogin = async (email) => {
  await delay(1500);

  // Find user by email or create a mock user
  const existingUser = mockUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );

  if (existingUser) {
    return {
      success: true,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        displayName: existingUser.display_name,
        avatarUrl: existingUser.avatar_url,
        role: existingUser.role,
      },
      message: `Welcome back, ${existingUser.display_name}!`,
    };
  }

  // For demo: accept any valid email
  const username = email.split("@")[0];
  return {
    success: true,
    user: {
      id: Date.now(),
      email,
      username,
      displayName: username,
      avatarUrl: "https://i1.sndcdn.com/avatars-default.jpg",
      role: "listener",
    },
    message: `Welcome, ${username}!`,
  };
};

/**
 * Mock Register
 * Simulates a registration request
 */
export const mockRegister = async ({
  email,
  password,
  displayName,
  username,
  age,
  gender,
}) => {
  await delay(1500);

  // Check if email already exists
  const exists = mockUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (exists) {
    throw new Error("An account with this email already exists");
  }

  return {
    success: true,
    user: {
      id: Date.now(),
      email,
      username: username || displayName.toLowerCase().replace(/[^a-z0-9]/g, ""),
      displayName,
      avatarUrl: "https://i1.sndcdn.com/avatars-default.jpg",
      role: "listener",
      age,
      gender,
    },
    message: `Account created successfully! Welcome, ${displayName}!`,
  };
};

/**
 * Mock Forgot Password
 * Simulates a password reset request
 */
export const mockForgotPassword = async (email) => {
  await delay(1500);

  // Always return success to prevent email enumeration
  return {
    success: true,
    message:
      "If an account exists with this email, you will receive a password reset link shortly.",
  };
};

/**
 * Mock OAuth Login
 * Simulates OAuth login (Google, Facebook, Apple)
 */
export const mockOAuthLogin = async (provider) => {
  await delay(2000);

  const mockOAuthUsers = {
    google: {
      email: "user@gmail.com",
      displayName: "Google User",
      avatarUrl:
        "https://i1.sndcdn.com/avatars-000007873027-0ror16-t500x500.jpg",
    },
    facebook: {
      email: "user@facebook.com",
      displayName: "Facebook User",
      avatarUrl:
        "https://i1.sndcdn.com/avatars-000003004402-pg96oj-t500x500.jpg",
    },
    apple: {
      email: "user@icloud.com",
      displayName: "Apple User",
      avatarUrl:
        "https://i1.sndcdn.com/avatars-000001411498-z0flxc-t500x500.jpg",
    },
  };

  const userData = mockOAuthUsers[provider] || mockOAuthUsers.google;

  return {
    success: true,
    user: {
      id: Date.now(),
      ...userData,
      username: userData.displayName.toLowerCase().replace(/\s+/g, ""),
      role: "listener",
    },
    message: `Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`,
  };
};
