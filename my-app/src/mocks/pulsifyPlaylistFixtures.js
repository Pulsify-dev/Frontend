/**
 * @file pulsifyPlaylistFixtures.js
 * @description Fake data 3shan n-test el UI (b-snake_case zay ma el backend 2alou).
 * Dih bas la7ad ma ykalsou el api bta3hom.
 */

export const mockPulsifyPlaylistsResponse = [
  {
    playlist_id: 'pl_98x72abc',
    creator_id: 'usr_owner123',
    playlist_name: 'Late Night Coding Vibes',
    playlist_description: 'Pure focus. Lo-Fi beats and synthwave for shipping code.',
    is_public: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=300&q=80',
    total_duration: 3600,
    track_count: 3,
    created_at: '2026-03-01T12:00:00Z',
    updated_at: '2026-03-12T15:30:00Z',
    tracks: [
      {
        track_id: 'tr_1001',
        track_title: 'Syntax Error (Lofi Remix)',
        artist_name: 'The Compilers',
        cover_art_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=150&q=80',
        duration_seconds: 210,
        play_count: 15420,
        is_explicit: false,
        added_at: '2026-03-05T09:15:00Z'
      },
      {
        track_id: 'tr_1002',
        track_title: 'Null Pointer Exception',
        artist_name: 'DJ StackTrace',
        cover_art_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80',
        duration_seconds: 185,
        play_count: 8900,
        is_explicit: true,
        added_at: '2026-03-06T10:00:00Z'
      },
      {
        track_id: 'tr_1003',
        track_title: 'Terminal Velocity',
        artist_name: 'Bash Script Boyz',
        cover_art_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=150&q=80',
        duration_seconds: 245,
        play_count: 22100,
        is_explicit: false,
        added_at: '2026-03-07T11:20:00Z'
      }
    ]
  },
  {
    playlist_id: 'pl_44y89xyz',
    creator_id: 'usr_owner123',
    playlist_name: 'Workout Hype 2026',
    playlist_description: 'High energy EDM to power through the sets.',
    is_public: false,
    thumbnail_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=300&q=80',
    total_duration: 1200,
    track_count: 1,
    created_at: '2026-02-15T08:00:00Z',
    updated_at: '2026-03-10T14:00:00Z',
    tracks: [
      {
        track_id: 'tr_2001',
        track_title: 'Drop The Table',
        artist_name: 'SQL Injection',
        cover_art_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=150&q=80',
        duration_seconds: 195,
        play_count: 50400,
        is_explicit: true,
        added_at: '2026-02-16T09:00:00Z'
      }
    ]
  }
];
