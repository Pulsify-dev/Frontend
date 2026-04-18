import React, { useState, useRef } from 'react';
import { PulsifyTrackService } from '../../services/pulsifyTrackService';

const FieldTooltip = ({ title, content }) => {
  return (
    <div className="pulsify-field-tooltip-container">
      <div className="tooltip-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
      <div className="tooltip-bubble">
        <div className="tooltip-arrow"></div>
        <div className="tooltip-title">{title}</div>
        <div className="tooltip-text">{content}</div>
      </div>
    </div>
  );
};

export const PulsifyMetadataForm = ({ file, artworkPreview, onArtworkSelect, onSubmit, isUploading }) => {
  const [title, setTitle] = useState(file ? file.name.replace(/\.[^/.]+$/, '') : '');
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [artistName, setArtistName] = useState('');
  const [visDropdownOpen, setVisDropdownOpen] = useState(false);
  const artworkInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title,
      genre,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      description,
      visibility,
      file
    });
  };

  const handleArtworkClick = () => {
    artworkInputRef.current?.click();
  };

  const handleArtworkChange = (e) => {
    const artFile = e.target.files[0];
    if (!artFile) return;
    const validation = PulsifyTrackService.validateArtworkFile(artFile);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    onArtworkSelect(artFile);
  };

  const handleVisSelect = (val) => {
    setVisibility(val);
    setVisDropdownOpen(false);
  };

  return (
    <div className="pulsify-trackinfo-page">
      <div className="artwork-section">
        <div className="artwork-preview" onClick={handleArtworkClick}>
          {artworkPreview ? (
            <img src={artworkPreview} alt="Artwork" />
          ) : (
            <div className="art-placeholder">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Add new artwork</span>
            </div>
          )}
          <input
            ref={artworkInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleArtworkChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div className="form-section">
        <form onSubmit={handleSubmit} id="pulsify-metadata-form">
          <div className="pulsify-form-group">
            <label className="with-tooltip">
              Track title <span style={{ color: '#e22134' }}>*</span>
              <FieldTooltip 
                title="Track title"
                content="Clear track titles help your fans know exactly what they're listening to."
              />
            </label>
            <input
              data-testid="meta-title-input"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name your track"
            />
            <div className="char-count">{title.length}/100</div>
          </div>

          <div className="pulsify-form-group track-link-field">
            <label>Track link</label>
            <input
              type="text"
              disabled
              value={`pulsify.page/${title.toLowerCase().replace(/\s+/g, '-') || 'your-track'}`}
              style={{ color: '#555' }}
            />
          </div>

          <div className="pulsify-form-group">
            <label className="with-tooltip">
              Main Artist(s)
              <FieldTooltip 
                title="Main Artist(s)"
                content="Put your name and any featured artists you want to give primary credit to here. These names will be displayed underneath your track title."
              />
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Your artist name"
            />
            <div className="form-hint">Tip: Use commas to add multiple artist names.</div>
          </div>

          <div className="pulsify-form-group">
            <label>Genre</label>
            <select
              required
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="" disabled>Add or search for genre</option>
              {PulsifyTrackService.GENRE_OPTIONS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="pulsify-form-group">
            <label className="with-tooltip">
              Tags
              <FieldTooltip 
                title="Tags"
                content="Tags help identify what kind of sound your track is, whether it is spoken voice, hip-hop, etc. Tags make it easier for listeners to find your track on Pulsify."
              />
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add styles, moods, tempos."
            />
          </div>

          <div className="pulsify-form-group">
            <label>Description</label>
            <textarea
              rows={1}
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tracks with descriptions tend to get more plays and engagements."
            />
            <div className="char-count">{description.length}/200</div>
          </div>

          <div className="pulsify-form-group">
            <div className="pulsify-visibility-wrapper">
              <div
                className="pulsify-visibility-trigger"
                onClick={() => setVisDropdownOpen(!visDropdownOpen)}
              >
                <div className="vis-header">
                  <div className={`vis-icon ${visibility}`}>
                    {visibility === 'public' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="vis-title">{visibility === 'public' ? 'Public' : 'Private'}</div>
                    <div className="vis-desc">
                      {visibility === 'public'
                        ? 'Anyone can access and listen to this track.'
                        : 'Track is not discoverable. Only people with private link can view and listen.'}
                    </div>
                  </div>
                </div>
                <svg className={`vis-chevron ${visDropdownOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              <div className={`pulsify-visibility-dropdown ${visDropdownOpen ? 'open' : ''}`}>
                <div
                  className={`pulsify-visibility-option ${visibility === 'public' ? 'active' : ''}`}
                  onClick={() => handleVisSelect('public')}
                >
                  <div className="opt-icon public">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    </svg>
                  </div>
                  <div>
                    <div className="opt-title">Public</div>
                    <div className="opt-desc">Anyone can access and listen to this track.</div>
                  </div>
                </div>

                <div
                  className={`pulsify-visibility-option ${visibility === 'private' ? 'active' : ''}`}
                  onClick={() => handleVisSelect('private')}
                >
                  <div className="opt-icon private">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <div>
                    <div className="opt-title">Private</div>
                    <div className="opt-desc">Track is not discoverable. Only people with private link can view and listen.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
