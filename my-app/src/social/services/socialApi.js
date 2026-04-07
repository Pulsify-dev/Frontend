import {
  mapUserDtoToUser,
  mapSocialCountsDto,
  mapBlockedUserDto,
} from "../adapters/socialAdapter";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/v1";

function getAuthHeaders() {
  const token =
    localStorage.getItem("pulsify_access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("pulsify_jwt_token") ||
    localStorage.getItem("pulsify_token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

/* ── Follow / Unfollow ─────────────────────────────── */

export async function followUserApi(userId) {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to follow user");
  return res.json();
}

export async function unfollowUserApi(userId) {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to unfollow user");
  return res.json();
}

/* ── Followers / Following Lists ───────────────────── */

export async function getFollowersApi(userId, page = 1, limit = 12) {
  const res = await fetch(
    `${API_BASE_URL}/users/${userId}/followers?page=${page}&limit=${limit}`,
  );
  if (!res.ok) throw new Error("Failed to fetch followers");
  const data = await res.json();
  return {
    users: (data.data || []).map(mapUserDtoToUser),
    pagination: data.pagination || { page, limit, total: 0 },
  };
}

export async function getFollowingApi(userId, page = 1, limit = 12) {
  const res = await fetch(
    `${API_BASE_URL}/users/${userId}/following?page=${page}&limit=${limit}`,
  );
  if (!res.ok) throw new Error("Failed to fetch following");
  const data = await res.json();
  return {
    users: (data.data || []).map(mapUserDtoToUser),
    pagination: data.pagination || { page, limit, total: 0 },
  };
}

/* ── Social Counts ─────────────────────────────────── */

export async function getSocialCountsApi(userId) {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/social-counts`);
  if (!res.ok) throw new Error("Failed to fetch social counts");
  const data = await res.json();
  return mapSocialCountsDto(data.data);
}

/* ── Block / Unblock ───────────────────────────────── */

export async function blockUserApi(userId, reason = "") {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/block`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error("Failed to block user");
  return res.json();
}

export async function unblockUserApi(userId) {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/block`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to unblock user");
  return res.json();
}

export async function updateBlockReasonApi(userId, reason) {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/block`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error("Failed to update block reason");
  return res.json();
}

export async function getBlockedUsersApi(page = 1, limit = 12) {
  const res = await fetch(
    `${API_BASE_URL}/users/me/blocked?page=${page}&limit=${limit}`,
    { headers: { ...getAuthHeaders() } },
  );
  if (!res.ok) throw new Error("Failed to fetch blocked users");
  const data = await res.json();
  return {
    users: (data.data || []).map(mapBlockedUserDto),
    pagination: data.pagination || { page, limit, total: 0 },
  };
}

/* ── Relationship Status ───────────────────────────── */

export async function getRelationshipApi(userId) {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/relationship`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch relationship");
  const data = await res.json();
  return data.data; // { is_following, is_followed_by, is_blocked }
}

/* ── Suggested Users ───────────────────────────────── */

export async function getSuggestedUsersApi(limit = 6) {
  const res = await fetch(`${API_BASE_URL}/users/suggested?limit=${limit}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch suggested users");
  const data = await res.json();
  return (data.data || []).map(mapUserDtoToUser);
}

/* ── Mutual Followers ──────────────────────────────── */

export async function getMutualFollowersApi(userId, limit = 6) {
  const res = await fetch(
    `${API_BASE_URL}/users/${userId}/mutual-followers?limit=${limit}`,
    { headers: { ...getAuthHeaders() } },
  );
  if (!res.ok) throw new Error("Failed to fetch mutual followers");
  const data = await res.json();
  return (data.data || []).map(mapUserDtoToUser);
}
