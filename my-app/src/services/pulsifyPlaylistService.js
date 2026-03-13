/**
 * @file pulsifyPlaylistService.js
 * @description El mock service bta3t el playlists.
 * B-tegib el fake data, trmyha 3la el adapter w trg3ha b promise 3shan n-simulate el delay
 * w kanena shaghaleen m3 server 7a2i2y.
 */

import { mockPulsifyPlaylistsResponse } from '../mocks/pulsifyPlaylistFixtures.js';
import { adaptPulsifyPlaylist } from '../utils/pulsifyPlaylistAdapter.js';

// Bn-simulate el internet delay 3shan tb2a waq3ya shwaya
const simulateNetworkDelay = () => {
  const delayMs = Math.floor(Math.random() * 500) + 300;
  return new Promise((resolve) => setTimeout(resolve, delayMs));
};

export const PulsifyPlaylistService = {

  /**
   * By-fetch el playlists bta3t el user.
   * Zay el endpoint da /api/v1/users/{userId}/playlists
   */
  async retrieveAllPlaylists() {
    await simulateNetworkDelay();
    
    // Simulate mapping the raw API response through our adapter
    return mockPulsifyPlaylistsResponse.map(rawPl => adaptPulsifyPlaylist(rawPl));
  },

  /**
   * By-fetch playlist wa7da b-tafyloha.
   * Zay /api/v1/playlists/{playlistId}
   * @param {string} targetPlaylistId 
   */
  async retrievePlaylistById(targetPlaylistId) {
    await simulateNetworkDelay();
    
    const rawTarget = mockPulsifyPlaylistsResponse.find(
      (pl) => pl.playlist_id === targetPlaylistId
    );

    if (!rawTarget) {
      throw new Error(`Pulsify Error: Playlist with ID ${targetPlaylistId} not found.`);
    }

    return adaptPulsifyPlaylist(rawTarget);
  }

};
