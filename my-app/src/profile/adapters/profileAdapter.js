export function mapProfileDtoToProfile(dto) {
  return {
    id: dto._id || dto.id,
    username: dto.username,
    displayName: dto.display_name,
    bio: dto.bio,
    location: dto.location,
    favoriteGenres: dto.favorite_genres ?? [],
    avatarUrl: dto.avatar_url,
    coverUrl: dto.cover_url,
    accountTier: dto.account_tier ?? dto.tier,
    isPrivate: dto.is_private,
    isVerified: dto.is_verified ?? false,
    socialLinks: dto.social_links ?? {},
    trackCount: dto.track_count ?? 0,
    followersCount: dto.followers_count ?? 0,
    followingCount: dto.following_count ?? 0,
    // Backend has no role field — infer from track_count for public profiles
    isArtist: (dto.track_count ?? 0) > 0,
  };
}

export function mapUpdateProfilePayloadToDto(payload) {
  return {
    display_name: payload.displayName,
    bio: payload.bio,
    location: payload.location,
    favorite_genres: payload.favoriteGenres,
    social_links: payload.socialLinks,
    is_private: payload.isPrivate,
  };
}
