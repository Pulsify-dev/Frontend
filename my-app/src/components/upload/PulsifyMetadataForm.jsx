import React, { useState, useRef } from 'react';
import { PulsifyTrackService } from '../../services/pulsifyTrackService';

export const PulsifyMetadataForm = ({ file, artworkPreview, onArtworkSelect, onSubmit, isUploading }) => {
  const [title, setTitle] = useState(file ? file.name.replace(/\.[^/.]+$/, '') : '');
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const artworkInputRef = useRef(null);

  const waveformBars = Array.from({ length: 60 }, (_, index) => {
    const base = file?.name
      ? file.name.charCodeAt(index % file.name.length)
      : index * 7;
    return Math.max(15, ((base * 13) % 81) + 15);
  });

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

  return (
    <div className="pulsify-trackinfo-page">
      <div className="artwork-section">
        <div className="artwork-preview" onClick={handleArtworkClick}>
          {artworkPreview ? (
            <img src={artworkPreview} alt="Artwork" />
          ) : (
            <div className="art-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
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
        <div className="artwork-label">
          {artworkPreview ? 'Click to change' : 'JPEG, PNG, or WebP'}
        </div>
      </div>

      <div className="form-section">
        <form onSubmit={handleSubmit} id="pulsify-metadata-form">
          <div className="pulsify-form-group">
            <label>Track title *</label>
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

          <div className="pulsify-form-group">
            <label>Track link</label>
            <input
              type="text"
              disabled
              value={`pulsify.page/${title.toLowerCase().replace(/\s+/g, '-') || 'your-track'}`}
              style={{ color: '#555' }}
            />
          </div>

          <div className="pulsify-form-group">
            <label>Genre *</label>
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
            <label>Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add styles, moods, tempos"
            />
          </div>

          <div className="pulsify-form-group">
            <label>Description</label>
            <textarea
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tracks with descriptions tend to get more plays and engagements."
            />
            <div className="char-count">{description.length}/200</div>
          </div>

          <div className="pulsify-form-group">
            <div
              className="pulsify-visibility-card"
              onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}
            >
              <div className="vis-header">
                <div className={`vis-icon ${visibility}`}>
                  {visibility === 'public' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17a2 2 0 002-2 2 2 0 00-2-2 2 2 0 00-2 2 2 2 0 002 2m6-9a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h1V6a5 5 0 0110 0v2h1m-6-2v2h4V6a2 2 0 00-2-2 2 2 0 00-2 2z"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div className="vis-title">{visibility === 'public' ? 'Public' : 'Private'}</div>
                  <div className="vis-desc">
                    {visibility === 'public'
                      ? 'Anyone can access and listen to this track.'
                      : 'Only you can access this track via direct link.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pulsify-waveform-mini">
            {waveformBars.map((height, i) => (
              <div
                key={i}
                className="bar"
                style={{ height: `${height}%`, animationDelay: `${i * 0.01}s` }}
              />
            ))}
          </div>
        </form>
      </div>
    </div>
  );
};
