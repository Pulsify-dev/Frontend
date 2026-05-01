import {
  mapUserDtoToUser,
  mapSocialCountsDto,
  mapBlockedUserDto,
} from "../adapters/socialAdapter";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

function getAuthHeaders() {
  const token =
    localStorage.getItem("pulsify_access_token") ||
    localStorage.getItem("pulsify_jwt_token");

  if (!token) return {};

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
  // 409 = already following — not an error
  if (res.status === 409) return { alreadyFollowing: true };
  // 403 = blocked by target user
  if (res.status === 403) throw new Error("BLOCKED_BY_TARGET");
  if (!res.ok) throw new Error("Failed to follow user");
  return res.json();
}

export async function unfollowUserApi(userId) {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  // 404 = not following anyway — not an error
  if (res.status === 404) return { alreadyUnfollowed: true };
  if (!res.ok) throw new Error("Failed to unfollow user");
  return res.json();
}

/* ── Followers / Following Lists ───────────────────── */

export async function getFollowersApi(userId, page = 1, limit = 12) {
  const res = await fetch(
    `${API_BASE_URL}/users/${userId}/followers?page=${page}&limit=${limit}`,
    { headers: { ...getAuthHeaders() } },
  );
  if (!res.ok) throw new Error("Failed to fetch followers");
  const data = await res.json();
  const inner = data.data || {};
  return {
    users: (inner.followers || inner.data || []).map((dto) => {
      // Backend may nest the user object under a 'follower' key
      const userDto = dto.follower || dto.user || dto;
      return mapUserDtoToUser(userDto);
    }),
    pagination: {
      page: inner.page || page,
      limit: inner.limit || limit,
      total: inner.total || 0,
    },
  };
}

export async function getFollowingApi(userId, page = 1, limit = 12) {
  const res = await fetch(
    `${API_BASE_URL}/users/${userId}/following?page=${page}&limit=${limit}`,
    { headers: { ...getAuthHeaders() } },
  );
  if (!res.ok) throw new Error("Failed to fetch following");
  const data = await res.json();
  const inner = data.data || {};
  return {
    users: (inner.following || inner.data || []).map((dto) => ({
      ...mapUserDtoToUser(dto),
      isFollowing: true,
    })),
    pagination: {
      page: inner.page || page,
      limit: inner.limit || limit,
      total: inner.total || 0,
    },
  };
}

/* ── Social Counts ─────────────────────────────────── */

export async function getSocialCountsApi(userId) {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/social-counts`, {
    headers: { ...getAuthHeaders() },
  });
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
  const inner = data.data || {};
  const rawList = inner.blocked_users || inner.blockedUsers || inner.data || [];
  return {
    users: rawList.map((entry) => {
      // API may return { blocked_user: {...}, reason, blocked_at }
      // or a flat user object directly
      const userDto = entry.blocked_user || entry.user || entry;
      return mapBlockedUserDto({
        ...userDto,
        reason: entry.reason || userDto.reason || "",
        blocked_at:
          entry.blocked_at || entry.blockedAt || userDto.blocked_at || null,
      });
    }),
    pagination: {
      page: inner.page || page,
      limit: inner.limit || limit,
      total: inner.total || 0,
    },
  };
}

/* ── Relationship Status ───────────────────────────── */

export async function getRelationshipApi(userId) {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/relationship`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch relationship");
  const data = await res.json();
  const inner = data.data || data || {};
  return {
    isFollowing: normalizeBoolean(inner.isFollowing ?? inner.is_following),
    isFollowedBy: normalizeBoolean(inner.isFollowedBy ?? inner.is_followed_by),
    isBlockedByMe: normalizeBoolean(
      inner.isBlockedByMe ?? inner.is_blocked_by_me ?? inner.isBlocked ?? inner.is_blocked,
    ),
    isBlockedByThem: normalizeBoolean(
      inner.isBlockedByThem ?? inner.is_blocked_by_them,
    ),
  };
}

/* ── Suggested Users ───────────────────────────────── */

export async function getSuggestedUsersApi(limit = 6) {
  const res = await fetch(`${API_BASE_URL}/users/me/suggested?limit=${limit}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch suggested users");
  const data = await res.json();
  const inner = data.data || {};
  const users = Array.isArray(inner.users)
    ? inner.users
    : Array.isArray(inner.data)
      ? inner.data
      : [];
  return users.map(mapUserDtoToUser);
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
