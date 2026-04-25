import React, { useState } from 'react';

export const PulsifyCreatePlaylistModal = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { title, is_private: isPrivate };
    if (description.trim() !== '') {
      payload.description = description.trim();
    }
    if (coverFile) {
      payload.file = coverFile;
    }
    onSubmit(payload);
    setTitle('');
    setDescription('');
    setIsPrivate(false);
    setCoverFile(null);
    setPreviewUrl('');
    onClose();
  };

  return (
    <div className="pulsify-modal-overlay">
      <div className="pulsify-modal-content" style={{ maxWidth: '500px' }}>
        <h2>Create New Set</h2>
        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            {/* Image Upload Area */}
            <div style={{ width: '150px', flexShrink: 0 }}>
              <div 
                style={{ 
                  width: '150px', height: '150px', backgroundColor: '#222', 
                  backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden'
                }}
                onClick={() => document.getElementById('playlist-cover-upload').click()}
              >
                {!previewUrl && <span style={{ color: '#666', fontSize: '12px' }}>Upload Image</span>}
                <input 
                  id="playlist-cover-upload"
                  type="file" 
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Fields Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="pulsify-form-group" style={{ marginBottom: 0 }}>
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
              <div className="pulsify-form-group pulsify-checkbox-group" style={{ marginBottom: 0 }}>
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
            </div>
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
