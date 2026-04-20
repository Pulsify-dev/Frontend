import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PulsifyTrackService } from '../services/pulsifyTrackService';
import '../components/upload/css/PulsifyMyTracks.css';

export const PulsifyMyTracksView = () => {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTrackId, setEditingTrackId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', genre: '', visibility: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState('all'); // all | public | private

  const fetchTracks = useCallback(async () => {
    try {
      setLoading(true);
      const result = await PulsifyTrackService.getArtistTracks('me');
      setTracks(result.tracks || []);
    } catch (err) {
      setError(err.message || 'Failed to load tracks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const handleEditClick = (track) => {
    setEditingTrackId(track._id);
    setEditForm({
      title: track.title,
      genre: track.genre,
      visibility: track.visibility
    });
  };

  const handleEditSave = async (trackId) => {
    try {
      await PulsifyTrackService.updateTrackMetadata(trackId, editForm);
      setTracks(prev => prev.map(t =>
        t._id === trackId ? { ...t, ...editForm } : t
      ));
      setEditingTrackId(null);
    } catch (err) {
      alert('Failed to update track: ' + err.message);
    }
  };

  const handleEditCancel = () => {
    setEditingTrackId(null);
  };

  const handleDelete = async (trackId) => {
    try {
      await PulsifyTrackService.deleteTrack(trackId);
      setTracks(prev => prev.filter(t => t._id !== trackId));
      setDeleteConfirm(null);
    } catch (err) {
      alert('Failed to delete track: ' + err.message);
    }
  };

  const filteredTracks = tracks.filter(t => {
    if (filter === 'public') return t.visibility === 'public';
    if (filter === 'private') return t.visibility === 'private';
    return true;
  });

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="pulsify-mytracks-page">
      {/* Header */}
      <div className="mytracks-header">
        <div className="mytracks-header-left">
          <h1>Your tracks</h1>
          <span className="mytracks-count">{tracks.length} track{tracks.length !== 1 ? 's' : ''}</span>
        </div>
        <button className="mytracks-upload-btn" onClick={() => navigate('/upload')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload new track
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mytracks-filters">
        {['all', 'public', 'private'].map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'all' && ` (${tracks.length})`}
            {f === 'public' && ` (${tracks.filter(t => t.visibility === 'public').length})`}
            {f === 'private' && ` (${tracks.filter(t => t.visibility === 'private').length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="mytracks-loading">
          <span className="mytracks-spinner"></span>
          <span>Loading your tracks...</span>
        </div>
      ) : error ? (
        <div className="mytracks-error">
          <span>⚠</span> {error}
          <button onClick={fetchTracks}>Retry</button>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="mytracks-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <h3>No tracks yet</h3>
          <p>Upload your first track to get started.</p>
          <button onClick={() => navigate('/upload')} className="mytracks-upload-btn">Upload a track</button>
        </div>
      ) : (
        <div className="mytracks-list">
          {filteredTracks.map((track, index) => (
            <div key={track._id} className="mytracks-row">
              {/* Track Number */}
              <span className="track-index">{index + 1}</span>

              {/* Artwork */}
              <div className="track-artwork">
                <img src={track.artwork_url} alt={track.title} />
                <div className="track-play-overlay">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>

              {/* Info */}
              <div className="track-info">
                {editingTrackId === track._id ? (
                  <div className="track-edit-form">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="edit-title-input"
                      autoFocus
                    />
                    <div className="edit-row">
                      <select
                        value={editForm.genre}
                        onChange={(e) => setEditForm(prev => ({ ...prev, genre: e.target.value }))}
                        className="edit-genre-select"
                      >
                        {PulsifyTrackService.GENRE_OPTIONS.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <select
                        value={editForm.visibility}
                        onChange={(e) => setEditForm(prev => ({ ...prev, visibility: e.target.value }))}
                        className="edit-vis-select"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                      <button className="edit-save-btn" onClick={() => handleEditSave(track._id)}>Save</button>
                      <button className="edit-cancel-btn" onClick={handleEditCancel}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Link to={`/tracks/${track._id}`} className="track-title-link">{track.title}</Link>
                    <div className="track-meta">
                      <span className="track-genre-badge">{track.genre}</span>
                      <span className={`track-visibility-badge ${track.visibility}`}>
                        {track.visibility === 'private' ? (
                          <><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg> Private</>
                        ) : (
                          <><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg> Public</>
                        )}
                      </span>
                      <span className={`track-status-badge ${track.status}`}>
                        {track.status === 'finished' ? '✓ Ready' : track.status === 'processing' ? '⏳ Processing' : '✕ Failed'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="track-stats">
                <span className="stat" title="Plays">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  {track.play_count}
                </span>
                <span className="stat" title="Likes">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  {track.like_count}
                </span>
                <span className="stat" title="Reposts">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
                  {track.repost_count}
                </span>
              </div>

              {/* Duration */}
              <span className="track-duration">{formatDuration(track.duration)}</span>

              {/* Date */}
              <span className="track-date">{formatDate(track.createdAt)}</span>

              {/* Actions */}
              <div className="track-actions">
                <button className="action-btn" title="Edit" onClick={() => handleEditClick(track)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button className="action-btn action-delete" title="Delete" onClick={() => setDeleteConfirm(track._id)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>

              {/* Delete Confirmation Dialog */}
              {deleteConfirm === track._id && (
                <div className="delete-dialog-overlay" onClick={() => setDeleteConfirm(null)}>
                  <div className="delete-dialog" onClick={(e) => e.stopPropagation()}>
                    <h3>Delete track?</h3>
                    <p>Are you sure you want to permanently delete "<strong>{track.title}</strong>"? This action cannot be undone.</p>
                    <div className="delete-dialog-actions">
                      <button className="dialog-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                      <button className="dialog-delete" onClick={() => handleDelete(track._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Waveform Preview (below the track list) */}
      {filteredTracks.length > 0 && (
        <div className="mytracks-waveform-section">
          <h3>Waveform Preview</h3>
          <p className="waveform-hint">Click on a track above to see its waveform on the track detail page.</p>
          <div className="waveform-demo">
            {Array.from({ length: 80 }).map((_, i) => (
              <div
                key={i}
                className="waveform-bar"
                style={{ height: `${Math.random() * 60 + 10}%` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
