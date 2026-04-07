import React, { useState } from 'react';

export const PulsifyCreatePlaylistModal = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, description, is_private: isPrivate });
    setTitle('');
    setDescription('');
    setIsPrivate(false);
    onClose();
  };

  return (
    <div className="pulsify-modal-overlay">
      <div className="pulsify-modal-content">
        <h2>Create New Set</h2>
        <form onSubmit={handleSubmit}>
          <div className="pulsify-form-group">
            <label>Name</label>
            <input 
              data-testid="create-playlist-name"
              type="text" 
              required 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="pulsify-input"
            />
          </div>
          <div className="pulsify-form-group">
            <label>Description</label>
            <textarea 
              data-testid="create-playlist-desc"
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="pulsify-input"
            />
          </div>
          <div className="pulsify-form-group pulsify-checkbox-group">
            <label>
              <input 
                data-testid="create-playlist-public"
                type="checkbox" 
                checked={isPrivate} 
                onChange={(e) => setIsPrivate(e.target.checked)} 
              />
              Private Set (Hidden)
            </label>
          </div>
          <div className="pulsify-modal-actions">
            <button data-testid="create-playlist-cancel" type="button" onClick={onClose} className="pulsify-btn pulsify-btn-outline">Cancel</button>
            <button data-testid="create-playlist-submit" type="submit" className="pulsify-btn pulsify-btn-brand">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};
