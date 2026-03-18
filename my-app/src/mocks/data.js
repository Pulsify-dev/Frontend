/**
 * Mock user data for development
 * Simulates backend API responses (snake_case format)
 */

export const mockUsers = [
  {
    id: 1,
    username: "artistuser",
    display_name: "The Artist",
    email: "artist@soundcloud.com",
    password: "password123",
    role: "artist",
    avatar_url: "https://i1.sndcdn.com/avatars-000007873027-0ror16-t500x500.jpg",
    header_url: "https://i1.sndcdn.com/visuals-000000007873027-Oe8dLc-t2480x520.jpg",
    bio: "Music producer and DJ. Creating beats since 2010.",
    followers_count: 15420,
    following_count: 342,
    tracks_count: 48,
    city: "Los Angeles",
    country: "United States",
    is_verified: true,
    created_at: "2020-01-15T10:30:00Z",
    updated_at: "2024-03-10T14:22:00Z",
  },
  {
    id: 2,
    username: "musiclover",
    display_name: "Music Lover",
    email: "listener@soundcloud.com",
    password: "password123",
    role: "listener",
    avatar_url: "https://i1.sndcdn.com/avatars-000003004402-pg96oj-t500x500.jpg",
    header_url: null,
    bio: "Just here for the music. Playlist curator.",
    followers_count: 89,
    following_count: 567,
    tracks_count: 0,
    city: "New York",
    country: "United States",
    is_verified: false,
    created_at: "2021-06-20T08:15:00Z",
    updated_at: "2024-02-28T11:45:00Z",
  },
  {
    id: 3,
    username: "djbeats",
    display_name: "DJ Beats",
    email: "djbeats@soundcloud.com",
    password: "password123",
    role: "artist",
    avatar_url: "https://i1.sndcdn.com/avatars-000001411498-z0flxc-t500x500.jpg",
    header_url: "https://i1.sndcdn.com/visuals-000001411498-YwL8v6-t2480x520.jpg",
    bio: "Electronic music producer. House, Techno, and everything in between.",
    followers_count: 8932,
    following_count: 156,
    tracks_count: 124,
    city: "Berlin",
    country: "Germany",
    is_verified: true,
    created_at: "2019-03-08T16:00:00Z",
    updated_at: "2024-03-12T09:30:00Z",
  },
];

/**
 * Mock tracks data
 */
export const mockTracks = [
  {
    id: 1,
    title: "Summer Vibes",
    artist_id: 1,
    artist_name: "The Artist",
    duration: 245,
    plays_count: 125000,
    likes_count: 8420,
    reposts_count: 1230,
    comments_count: 342,
    genre: "Electronic",
    artwork_url: "https://i1.sndcdn.com/artworks-000123456789-abcdef-t500x500.jpg",
    waveform_url: "https://wave.sndcdn.com/abcdef123456_m.png",
    is_public: true,
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    title: "Night Drive",
    artist_id: 3,
    artist_name: "DJ Beats",
    duration: 312,
    plays_count: 89000,
    likes_count: 5210,
    reposts_count: 890,
    comments_count: 156,
    genre: "House",
    artwork_url: "https://i1.sndcdn.com/artworks-000987654321-fedcba-t500x500.jpg",
    waveform_url: "https://wave.sndcdn.com/fedcba654321_m.png",
    is_public: true,
    created_at: "2024-02-20T14:15:00Z",
  },
];

/**
 * Mock authentication tokens
 */
export const mockTokens = {
  accessToken: "mock_access_token_12345",
  refreshToken: "mock_refresh_token_67890",
  expiresIn: 3600,
};
