/* ── Mock Data ─────────────────────────────────────── */

const AVATARS = [
  "https://i.pravatar.cc/150?u=user1",
  "https://i.pravatar.cc/150?u=user2",
  "https://i.pravatar.cc/150?u=user3",
  "https://i.pravatar.cc/150?u=user5",
  "https://i.pravatar.cc/150?u=user6",
  "https://i.pravatar.cc/150?u=user7",
  "https://i.pravatar.cc/150?u=user8",
  "https://i.pravatar.cc/150?u=user9",
  "https://i.pravatar.cc/150?u=user10",
  "https://i.pravatar.cc/150?u=user11",
  "https://i.pravatar.cc/150?u=user12",
];

const NAMES = [
  "Hajer Hassan",
  "Podcast Eh El Moshkela",
  "Omar Khaled",
  "Sarah Ahmed",
  "Nour El-Din",
  "Youssef Tarek",
  "Lina Mostafa",
  "Kareem Adel",
  "Dina Samir",
  "Ali Mahmoud",
  "Rania Fawzy",
  "Moustafa Nabil",
];

const BIOS = [
  "Music producer & beatmaker",
  "Podcast host | 5K+ followers",
  "Lo-fi hip hop artist from Cairo",
  "Singer-songwriter | New EP out now",
  "DJ & electronic music lover",
  "Audio engineer | Sound designer",
  "Indie artist | Folk & acoustic",
  "Rapper & lyricist",
  "Music blogger | Reviewing daily",
  "Ambient soundscapes creator",
  "Classical pianist gone digital",
  "Bass player | Session musician",
];

function makeMockUser(index) {
  return {
    id: `mock_user_${index}`,
    username: NAMES[index % NAMES.length].toLowerCase().replace(/\s+/g, "_"),
    displayName: NAMES[index % NAMES.length],
    avatarUrl: AVATARS[index % AVATARS.length],
    bio: BIOS[index % BIOS.length],
    location: index % 2 === 0 ? "Cairo, Egypt" : "Alexandria, Egypt",
    followersCount: Math.floor(Math.random() * 10000),
    followingCount: Math.floor(Math.random() * 500),
    isFollowing: index % 3 === 0,
    isBlocked: false,
    accountTier: index % 4 === 0 ? "artist" : "listener",
  };
}

function generateUsers(count, startIndex = 0) {
  return Array.from({ length: count }, (_, i) => makeMockUser(startIndex + i));
}

let mockFollowers = generateUsers(18);
let mockFollowing = generateUsers(8, 5);
let mockBlocked = [
  {
    id: "blocked_1",
    username: "spammer_bot",
    displayName: "Spam Account",
    avatarUrl: "https://i.pravatar.cc/150?u=blocked1",
    reason: "Spam and self-promotion",
    blockedAt: "2025-12-01T10:00:00Z",
  },
  {
    id: "blocked_2",
    username: "troll_user",
    displayName: "Troll User",
    avatarUrl: "https://i.pravatar.cc/150?u=blocked2",
    reason: "Harassment in comments",
    blockedAt: "2026-01-15T14:30:00Z",
  },
];
let mockSuggested = generateUsers(6, 20);

/* following state tracking */
const followingSet = new Set(mockFollowing.map((u) => u.id));
const blockedSet = new Set(mockBlocked.map((u) => u.id));

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function paginate(arr, page, limit) {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    users: arr.slice(start, end),
    pagination: {
      page,
      limit,
      total: arr.length,
      totalPages: Math.ceil(arr.length / limit),
    },
  };
}

/* ── Follow / Unfollow ─────────────────────────────── */

export async function followUserMock(userId) {
  await wait(300);
  followingSet.add(userId);
  const existingUser = mockFollowers.find((u) => u.id === userId);
  if (existingUser) existingUser.isFollowing = true;
  return { success: true, message: "Followed successfully" };
}

export async function unfollowUserMock(userId) {
  await wait(300);
  followingSet.delete(userId);
  const existingUser = mockFollowers.find((u) => u.id === userId);
  if (existingUser) existingUser.isFollowing = false;
  mockFollowing = mockFollowing.filter((u) => u.id !== userId);
  return { success: true, message: "Unfollowed successfully" };
}

/* ── Followers / Following Lists ───────────────────── */

export async function getFollowersMock(_userId, page = 1, limit = 12) {
  await wait(400);
  return paginate(mockFollowers, page, limit);
}

export async function getFollowingMock(_userId, page = 1, limit = 12) {
  await wait(400);
  return paginate(mockFollowing, page, limit);
}

/* ── Social Counts ─────────────────────────────────── */

export async function getSocialCountsMock(_userId) {
  await wait(200);
  return {
    followersCount: mockFollowers.length,
    followingCount: mockFollowing.length,
    blockedCount: mockBlocked.length,
  };
}

/* ── Block / Unblock ───────────────────────────────── */

export async function blockUserMock(userId, reason = "") {
  await wait(300);
  blockedSet.add(userId);
  followingSet.delete(userId);
  mockFollowing = mockFollowing.filter((u) => u.id !== userId);
  mockFollowers = mockFollowers.filter((u) => u.id !== userId);
  mockBlocked.push({
    id: userId,
    username: `user_${userId}`,
    displayName: `User ${userId}`,
    avatarUrl: `https://i.pravatar.cc/150?u=${userId}`,
    reason,
    blockedAt: new Date().toISOString(),
  });
  return { success: true, message: "Blocked successfully" };
}

export async function unblockUserMock(userId) {
  await wait(300);
  blockedSet.delete(userId);
  mockBlocked = mockBlocked.filter((u) => u.id !== userId);
  return { success: true, message: "Unblocked successfully" };
}

export async function updateBlockReasonMock(userId, reason) {
  await wait(300);
  const blocked = mockBlocked.find((u) => u.id === userId);
  if (blocked) blocked.reason = reason;
  return {
    success: true,
    message: "Block reason updated",
    data: { blocker_id: "me", blocked_id: userId, reason },
  };
}

export async function getBlockedUsersMock(page = 1, limit = 12) {
  await wait(400);
  return paginate(mockBlocked, page, limit);
}

/* ── Relationship Status ───────────────────────────── */

export async function getRelationshipMock(userId) {
  await wait(200);
  return {
    is_following: followingSet.has(userId),
    is_followed_by: mockFollowers.some((u) => u.id === userId),
    is_blocked: blockedSet.has(userId),
  };
}

/* ── Suggested Users ───────────────────────────────── */

export async function getSuggestedUsersMock(limit = 6) {
  await wait(400);
  return mockSuggested.slice(0, limit);
}

/* ── Mutual Followers ──────────────────────────────── */

export async function getMutualFollowersMock(_userId, limit = 6) {
  await wait(300);
  return mockFollowers.filter((u) => u.isFollowing).slice(0, limit);
}
