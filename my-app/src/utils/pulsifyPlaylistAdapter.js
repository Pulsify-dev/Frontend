/**
 * @file pulsifyPlaylistAdapter.js
 * @description 3shan el backend beyb3t snake_case we e7na m7tagin camelCase fel frontend,
 * el file da hy-map el data 3shan el components teshta3'al 3ady.
 */

/**
 * By-transform el track object mn snake_case l camelCase.
 * @param {Object} rawTrack - el track object el raw mn el backend
 * @returns {Object} el track nedeef camelCase
 */
export const adaptPulsifyTrack = (rawTrack) => {
  if (!rawTrack) return null;

  return {
    trackId: rawTrack.track_id,
    trackTitle: rawTrack.track_title,
    artistName: rawTrack.artist_name,
    coverArtUrl: rawTrack.cover_art_url,
    durationSeconds: rawTrack.duration_seconds,
    playCount: rawTrack.play_count,
    isExplicit: rawTrack.is_explicit || false,
    addedAt: rawTrack.added_at,
  };
};

export const adaptPulsifyPlaylist = (rawPlaylist) => {
  if (!rawPlaylist) return null;

  return {
    playlistId: rawPlaylist.playlist_id,
    creatorId: rawPlaylist.creator_id,
    playlistName: rawPlaylist.playlist_name,
    playlistDescription: rawPlaylist.playlist_description,
    isPublic: rawPlaylist.is_public,
    thumbnailUrl: rawPlaylist.thumbnail_url,
    totalDuration: rawPlaylist.total_duration || 0,
    trackCount: rawPlaylist.track_count || 0,
    createdAt: rawPlaylist.created_at,
    updatedAt: rawPlaylist.updated_at,
    // Safely map over tracks if they are nested inside the playlist response
    tracks: rawPlaylist.tracks ? rawPlaylist.tracks.map(adaptPulsifyTrack) : [],
  };
};
