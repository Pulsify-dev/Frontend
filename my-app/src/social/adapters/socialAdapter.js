/**
 * Maps backend user DTOs to frontend-friendly models
 * for followers, following, blocked users, and suggested users.
 */

export function mapUserDtoToUser(dto) {
  return {
    id: dto._id || dto.id,
    username: dto.username,
    displayName: dto.display_name || dto.displayName || dto.username,
    avatarUrl: dto.avatar_url || dto.avatarUrl || null,
    bio: dto.bio || "",
    location: dto.location || "",
    followersCount: dto.followers_count ?? dto.followersCount ?? 0,
    followingCount: dto.following_count ?? dto.followingCount ?? 0,
    isFollowing: dto.is_following ?? dto.isFollowing ?? false,
    isBlocked: dto.is_blocked ?? dto.isBlocked ?? false,
    accountTier: dto.account_tier || dto.accountTier || "listener",
  };
}

export function mapSocialCountsDto(dto) {
  return {
    followersCount: dto.followers_count ?? 0,
    followingCount: dto.following_count ?? 0,
    blockedCount: dto.blocked_count ?? 0,
  };
}

export function mapBlockedUserDto(dto) {
  return {
    id: dto._id || dto.id,
    username: dto.username,
    displayName: dto.display_name || dto.displayName || dto.username,
    avatarUrl: dto.avatar_url || dto.avatarUrl || null,
    reason: dto.reason || "",
    blockedAt: dto.blocked_at || dto.blockedAt || null,
  };
}
