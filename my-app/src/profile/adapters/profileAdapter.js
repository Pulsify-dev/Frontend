export function mapProfileDtoToProfile(dto) {
  return {
    id: dto._id || dto.id,
    username: dto.username,
    displayName: dto.display_name,
    bio: dto.bio,
    location: dto.location,
    favoriteGenres: dto.favorite_genres,
    avatarUrl: dto.avatar_url,
    coverUrl: dto.cover_url,
    accountTier: dto.account_tier,
    isPrivate: dto.is_private,
    socialLinks: dto.social_links ?? {},
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
