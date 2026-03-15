import React, { useState } from 'react';

export const PulsifyCreatePlaylistModal = ({ isOpen, onClose, onSubmit }) => {
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ playlistName, playlistDescription, isPublic });
    setPlaylistName('');
    setPlaylistDescription('');
    setIsPublic(true);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', 
      justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '8px', width: '400px', color: 'white' }}>
        <h2>Create New Set</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Name</label>
            <input 
              type="text" 
              required 
              value={playlistName} 
              onChange={(e) => setPlaylistName(e.target.value)} 
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
            <textarea 
              value={playlistDescription} 
              onChange={(e) => setPlaylistDescription(e.target.value)} 
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label>
              <input 
                type="checkbox" 
                checked={isPublic} 
                onChange={(e) => setIsPublic(e.target.checked)} 
              />
              Public Playlist (Searchable)
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#f50', color: 'white', border: 'none', cursor: 'pointer' }}>Create</button>
          </div>
        </form>
      </div>
    </div>
  );
};
