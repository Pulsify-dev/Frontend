import React, { useState } from 'react';

export const PulsifyCreateAlbumModal = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Electronic');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Album');
  const [visibility, setVisibility] = useState('public');
  const [artworkFile, setArtworkFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArtworkFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { title, genre, type, visibility };
    if (description.trim() !== '') {
      payload.description = description.trim();
    }
    if (artworkFile) {
      payload.artwork = artworkFile;
    }
    onSubmit(payload);
    setTitle('');
    setGenre('Electronic');
    setDescription('');
    setType('Album');
    setVisibility('public');
    setArtworkFile(null);
    setPreviewUrl('');
    onClose();
  };

  return (
    <div className="pulsify-modal-overlay">
      <div className="pulsify-modal-content" style={{ maxWidth: '500px' }}>
        <h2>Create New Album</h2>
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
                onClick={() => document.getElementById('album-cover-upload').click()}
              >
                {!previewUrl && <span style={{ color: '#666', fontSize: '12px' }}>Upload Artwork</span>}
                <input 
                  id="album-cover-upload"
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
                <label>Title <span style={{ color: '#f50' }}>*</span></label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="pulsify-input"
                  placeholder="Album title"
                />
              </div>
              <div className="pulsify-form-group" style={{ marginBottom: 0 }}>
                <label>Genre <span style={{ color: '#f50' }}>*</span></label>
                <select 
                  value={genre} 
                  onChange={(e) => setGenre(e.target.value)} 
                  className="pulsify-input"
                >
                  <option>Electronic</option>
                  <option>Hip-hop & Rap</option>
                  <option>Pop</option>
                  <option>R&B & Soul</option>
                  <option>Rock</option>
                  <option>Classical</option>
                  <option>Jazz</option>
                  <option>Lo-Fi</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="pulsify-form-group" style={{ marginBottom: 0 }}>
                <label>Type</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  className="pulsify-input"
                >
                  <option>Album</option>
                  <option>EP</option>
                  <option>Single</option>
                  <option>Compilation</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pulsify-form-group">
            <label>Description</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="pulsify-input"
              placeholder="Describe your album"
            />
          </div>

          <div className="pulsify-form-group pulsify-checkbox-group" style={{ marginBottom: 0 }}>
            <label>
              <input 
                type="checkbox" 
                checked={visibility === 'private'} 
                onChange={(e) => setVisibility(e.target.checked ? 'private' : 'public')} 
              />
              Private (Hidden)
            </label>
          </div>

          <div className="pulsify-modal-actions">
            <button type="button" onClick={onClose} className="pulsify-btn pulsify-btn-outline">Cancel</button>
            <button type="submit" className="pulsify-btn pulsify-btn-brand">Create Album</button>
          </div>
        </form>
      </div>
    </div>
  );
};
