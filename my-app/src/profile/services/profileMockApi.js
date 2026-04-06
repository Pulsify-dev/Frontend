let mockProfile = {
  id: "u1",
  username: "ahmad",
  displayName: "Ahmad Hisham",
  bio: "Frontend developer and music lover.",
  location: "Cairo, Egypt",
  favoriteGenres: ["Lo-fi", "Hip-Hop", "EDM"],
  avatarUrl: "https://via.placeholder.com/120",
  coverUrl: "https://via.placeholder.com/900x250",
  accountTier: "artist",
  isPrivate: false,
  socialLinks: {
    instagram: "https://instagram.com/example",
    twitter: "https://twitter.com/example",
    website: "https://example.com",
  },
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getMyProfileMock() {
  await wait(300);
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
