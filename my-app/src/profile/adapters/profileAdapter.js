export function mapProfileDtoToProfile(dto) {
  return {
    id: dto._id || dto.id,
    username: dto.username,
    displayName: dto.display_name ?? dto.displayName ?? dto.username,
    bio: dto.bio,
    location: dto.location,
    favoriteGenres: dto.favorite_genres ?? dto.favoriteGenres ?? [],
    avatarUrl: dto.avatar_url ?? dto.avatarUrl,
    coverUrl: dto.cover_url ?? dto.coverUrl,
    accountTier: dto.account_tier ?? dto.accountTier,
    isPrivate: dto.is_private ?? dto.isPrivate,
    socialLinks: dto.social_links ?? {},
    likesCount:
      dto.likes_count ??
      dto.likesCount ??
      dto.liked_tracks_count ??
      dto.likedTracksCount ??
      0,
    repostsCount:
      dto.reposts_count ??
      dto.repostsCount ??
      dto.reposted_tracks_count ??
      dto.repostedTracksCount ??
      0,
    trackCount:
      dto.track_count ??
      dto.trackCount ??
      dto.tracks_count ??
      dto.tracksCount ??
      0,
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
