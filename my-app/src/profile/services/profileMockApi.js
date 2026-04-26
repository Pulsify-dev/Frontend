let mockProfile = {
  id: "usr-viewer",
  username: "mayar-ayman-15",
  displayName: "Mayar Ayman",
  bio: "Late-night electronic sketches, live takes, and headphone-first mixes from Cairo.",
  location: "Cairo, Egypt",
  favoriteGenres: ["Electronic", "Indie", "House"],
  avatarUrl:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
  coverUrl: "",
  accountTier: "artist",
  isPrivate: false,
  trackCount: 3,
  likesCount: 67,
  socialLinks: {
    instagram: "https://instagram.com/mayarayman",
    twitter: "https://twitter.com/mayarayman",
    website: "https://pulsify.example/mayar-ayman",
  },
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function syncMockViewerIdentity() {
  if (typeof window === "undefined") return;

  window.localStorage.setItem("userId", mockProfile.id);
  window.localStorage.setItem("username", mockProfile.username);
  window.localStorage.setItem("displayName", mockProfile.displayName);
}

export async function getMyProfileMock() {
  await wait(300);
  syncMockViewerIdentity();
  return mockProfile;
}

export async function getPublicProfileMock(userId) {
  await wait(300);
  return {
    ...mockProfile,
    id: userId,
    username: `user_${userId}`,
    displayName: "Public User",
  };
}

export async function updateMyProfileMock(payload) {
  await wait(300);

  mockProfile = {
    ...mockProfile,
    displayName: payload.displayName,
    bio: payload.bio,
    location: payload.location,
    favoriteGenres: payload.favoriteGenres,
    isPrivate: payload.isPrivate,
    socialLinks: payload.socialLinks,
  };

  syncMockViewerIdentity();
  return mockProfile;
}

export async function uploadAvatarMock(file) {
  await wait(300);
  const url = URL.createObjectURL(file);
  mockProfile = { ...mockProfile, avatarUrl: url }; // keep in sync
  return url;
}

export async function uploadCoverMock(file) {
  await wait(300);
  const url = URL.createObjectURL(file);
  mockProfile = { ...mockProfile, coverUrl: url }; // keep in sync
  return url;
}
