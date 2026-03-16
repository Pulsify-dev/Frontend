/**
 * @file pulsifyPlaylistService.js
 * @description El mock service bta3t el playlists.

 */

import { mockPulsifyPlaylistsResponse } from '../mocks/pulsifyPlaylistFixtures.js';
import { adaptPulsifyPlaylist } from '../utils/pulsifyPlaylistAdapter.js';

// Bn-simulate el internet delay 3shan tb2a waq3ya shwaya
const simulateNetworkDelay = () => {
  const delayMs = Math.floor(Math.random() * 500) + 300;
  return new Promise((resolve) => setTimeout(resolve, delayMs));
};

export const PulsifyPlaylistService = {

  async retrieveAllPlaylists() {
    await simulateNetworkDelay();

    // Simulate mapping the raw API response through our adapter
    return mockPulsifyPlaylistsResponse.map(rawPl => adaptPulsifyPlaylist(rawPl));
  },

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
