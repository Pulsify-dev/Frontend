import React, { useState, useEffect } from 'react';
import { PulsifyPlaylistService } from '../../services/pulsifyPlaylistService';
import '../../css/AddToPlaylistModal.css';

export const AddToPlaylistModal = ({ isOpen, onClose, trackId }) => {
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'create'
  
  // State for "Add to playlist" tab
  const [playlists, setPlaylists] = useState([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [addingToId, setAddingToId] = useState(null);
  const [addedPlaylists, setAddedPlaylists] = useState(new Set()); // Keep track of which ones were successfully added
  
  // State for "Create playlist" tab
  const [newTitle, setNewTitle] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Global message for the modal
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state when opened
      setActiveTab('add');
      setFilterQuery('');
      setNewTitle('');
      setIsPrivate(false);
      setToastMessage(null);
      setAddedPlaylists(new Set());
      fetchUserPlaylists();
    }
  }, [isOpen]);

  const fetchUserPlaylists = async () => {
    setIsLoading(true);
    try {
      const response = await PulsifyPlaylistService.getMyPlaylists();
      setPlaylists(response.data || response.playlists || []);
    } catch (err) {
      console.error('Failed to load playlists', err);
      showToast('Failed to load your playlists.');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (addedPlaylists.has(playlistId)) return; // Already added
    
    setAddingToId(playlistId);
    try {
      await PulsifyPlaylistService.addTrackToPlaylist(playlistId, trackId);
      setAddedPlaylists(prev => new Set(prev).add(playlistId));
      showToast('Track successfully added to playlist!');
    } catch (err) {
      console.error(err);
      showToast('Error adding track to playlist. Please try again.');
    } finally {
      setAddingToId(null);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      const payload = {
        title: newTitle.trim(),
        is_private: isPrivate
      };
      
      const createResponse = await PulsifyPlaylistService.createPlaylist(payload);
      
      const newPlaylist = createResponse.data || createResponse;
      const newPlaylistId = newPlaylist._id || newPlaylist.id;

      // 2. Automatically add the track to it
      if (newPlaylistId && trackId) {
        await PulsifyPlaylistService.addTrackToPlaylist(newPlaylistId, trackId);
      }

      showToast('Playlist created and track added!');
      
      // Update local lists and switch tabs so user sees the new playlist
      await fetchUserPlaylists();
      setNewTitle('');
      setActiveTab('add');
      
      // We know we just added it to the new one
      if (newPlaylistId) {
        setAddedPlaylists(prev => new Set(prev).add(newPlaylistId));
      }

    } catch (err) {
      console.error(err);
      showToast('Error creating playlist.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  const filteredPlaylists = playlists.filter(p => 
    p.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="add-playlist-modal-overlay" onClick={onClose}>
      <div className="add-playlist-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header / Tabs */}
        <div className="add-playlist-modal-header">
          <button 
            className={`add-playlist-tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add to playlist
          </button>
          <button 
            className={`add-playlist-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create a playlist
          </button>
          <button className="add-playlist-close-btn" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="add-playlist-modal-body">
          {toastMessage && (
            <div className="add-playlist-toast">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              {toastMessage}
            </div>
          )}

          {activeTab === 'add' && (
            <>
              <input 
                type="text" 
                className="add-playlist-filter" 
                placeholder="Filter playlists"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
              
              {isLoading ? (
                <div className="add-playlist-loading">Loading playlists...</div>
              ) : playlists.length === 0 ? (
                <div className="add-playlist-empty">
                  You don't have any playlists yet. Click 'Create a playlist' to get started.
                </div>
              ) : filteredPlaylists.length === 0 ? (
                <div className="add-playlist-empty">
                  No playlists match your search.
                </div>
              ) : (
                <div className="add-playlist-list">
                  {filteredPlaylists.map(playlist => {
                    const isAdded = addedPlaylists.has(playlist._id || playlist.id);
                    const isAddingThis = addingToId === (playlist._id || playlist.id);
                    
                    return (
                      <div key={playlist._id || playlist.id} className="add-playlist-row">
                        <img 
                          src={playlist.cover_url || playlist.artwork_url || 'https://placehold.co/40x40/222/555?text=♪'} 
                          alt="" 
                          className="add-playlist-row-img"
                        />
                        <div className="add-playlist-row-info">
                          <div className="add-playlist-row-title">{playlist.title}</div>
                          <div className="add-playlist-row-meta">
                            {playlist.is_private && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                              </svg>
                            )}
                            {playlist.track_count || playlist.tracks?.length || 0} tracks
                          </div>
                        </div>
                        <button 
                          className={`add-playlist-action-btn ${isAdded ? 'added' : ''}`}
                          onClick={() => handleAddToPlaylist(playlist._id || playlist.id)}
                          disabled={isAdded || isAddingThis}
                        >
                          {isAddingThis ? 'Adding...' : isAdded ? 'Added' : 'Add to playlist'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'create' && (
            <form className="create-playlist-form" onSubmit={handleCreatePlaylist}>
              <div className="create-playlist-group">
                <label>Playlist title</label>
                <input 
                  type="text" 
                  className="create-playlist-input" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="New playlist title"
                  required
                  autoFocus
                />
              </div>
              
              <div className="create-playlist-group">
                <label className="create-playlist-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  Private (only you and people you share a secret link with can listen)
                </label>
              </div>

              <div className="create-playlist-actions">
                <button 
                  type="submit" 
                  className="create-playlist-save-btn"
                  disabled={!newTitle.trim() || isCreating}
                >
                  {isCreating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
