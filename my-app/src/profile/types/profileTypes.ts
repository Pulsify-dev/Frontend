export type AccountTier = "artist" | "listener";

export type SocialLinks = {
  instagram?: string;
  twitter?: string;
  website?: string;
};

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  location: string;
  favoriteGenres: string[];
  avatarUrl: string;
  coverUrl: string;
  accountTier: AccountTier;
  isPrivate: boolean;
  socialLinks: SocialLinks;
};

export type ProfileDto = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  location: string;
  favorite_genres: string[];
  avatar_url: string;
  cover_url: string;
  account_tier: AccountTier;
  is_private: boolean;
  social_links: SocialLinks;
};

export type UpdateProfilePayload = {
  displayName: string;
  bio: string;
  location: string;
  favoriteGenres: string[];
  isPrivate: boolean;
  socialLinks: SocialLinks;
};
