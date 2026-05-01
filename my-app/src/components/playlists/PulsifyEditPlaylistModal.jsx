import React, { useState, useEffect, useRef } from 'react';
import { PulsifyPlaylistService } from '../../services/pulsifyPlaylistService';

export const PulsifyEditPlaylistModal = ({ isOpen, onClose, playlist, onSaveSuccess }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [editForm, setEditForm] = useState({ 
    title: '', description: '', is_private: false, cover_url: '', secret_token: '', permalink: '' 
  });

  useEffect(() => {
    if (isOpen && playlist) {
      setEditForm({
        title: playlist.title || '',
        description: playlist.description || '',
        is_private: playlist.is_private || false,
        cover_url: playlist.cover_url || '',
        secret_token: playlist.secret_token || '',
        permalink: playlist.permalink || ''
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [isOpen, playlist]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  if (!isOpen) return null;

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const playlistId = playlist._id || playlist.id;
      let updatePayload;

      if (imageFile) {
        // Send as FormData so the backend multer middleware can process the file
        updatePayload = new FormData();
        updatePayload.append('title', editForm.title || playlist.title);
        if (editForm.description || playlist.description) {
          updatePayload.append('description', editForm.description || playlist.description || '');
        }
        updatePayload.append('file', imageFile);
      } else {
        updatePayload = { title: editForm.title || playlist.title };
        if (editForm.description || playlist.description) {
          updatePayload.description = editForm.description || playlist.description || '';
        }
      }
      
      const result = await PulsifyPlaylistService.updatePlaylist(playlistId, updatePayload);
      
      let finalPrivacy = playlist.is_private;
      let finalSecretToken = editForm.secret_token;

      if (editForm.is_private !== playlist.is_private) {
        const privacyRes = await PulsifyPlaylistService.togglePrivacy(playlistId, editForm.is_private);
        finalPrivacy = editForm.is_private;
        if (privacyRes?.data?.secret_token) {
          finalSecretToken = privacyRes.data.secret_token;
        } else if (privacyRes?.secret_token) {
          finalSecretToken = privacyRes.secret_token;
        }
      }
      
      if (onSaveSuccess) {
        const updatedData = result?.data || result || {};
        onSaveSuccess({ ...playlist, ...updatedData, is_private: finalPrivacy, secret_token: finalSecretToken });
      }
      onClose();
    } catch (e) {
      const errorMsg = e.response?.data?.message || e.response?.data?.error || e.message;
      console.error("Save error:", e.response?.status || e.message);
      alert("Failed to save changes: " + errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateToken = async () => {
    setIsRegenerating(true);
    try {
      const playlistId = playlist._id || playlist.id;
      const res = await PulsifyPlaylistService.regenerateToken(playlistId);
      const newToken = res?.data?.secret_token || res?.secret_token;
      if (newToken) {
        setEditForm(prev => ({ ...prev, secret_token: newToken }));
      }
    } catch (e) {
      alert("Failed to regenerate token: " + (e.response?.data?.message || e.message));
    } finally {
      setIsRegenerating(false);
    }
  };

  const getSecretLink = () => {
    const baseUrl = window.location.origin;
    const permalink = editForm.permalink || editForm.title.toLowerCase().replace(/\s+/g, '-');
    return `${baseUrl}/playlists/${permalink}?token=${editForm.secret_token}`;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter",sans-serif' }}>
      <div style={{ backgroundColor: '#111', width: '850px', borderRadius: '4px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Modal Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #333', padding: '0 20px', gap: '20px' }}>
          <div style={{ padding: '20px 0', borderBottom: '2px solid #f50', color: '#fff', fontSize: '15px', fontWeight: 'bold' }}>Basic Info</div>
          <div style={{ padding: '20px 0', color: '#999', fontSize: '15px', fontWeight: 'bold' }}>Tracks</div>
          <div style={{ padding: '20px 0', color: '#999', fontSize: '15px', fontWeight: 'bold' }}>Metadata</div>
        </div>
        
        {/* Modal Body */}
        <div style={{ display: 'flex', padding: '24px', gap: '30px', maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ width: '260px', flexShrink: 0 }}>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
            <div style={{ width: '100%', aspectRatio: '1/1', background: 'linear-gradient(135deg, #443 0%, #224 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
               {(imagePreview || editForm.cover_url) ? <img src={imagePreview || editForm.cover_url} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : null}
               <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>{imageFile ? 'Change image' : 'Upload image'}</button>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Title <span style={{ color: '#f50' }}>*</span></label>
              <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} style={{ width: '100%', backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Permalink <span style={{ color: '#f50' }}>*</span></label>
              <div style={{ display: 'flex', backgroundColor: '#222', border: '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}>
                <span style={{ padding: '10px 8px', color: '#999', backgroundColor: '#1a1a1a', fontSize: '13px' }}>pulsify.page/playlists/</span>
                <input type="text" value={editForm.title.toLowerCase().replace(/\s+/g, '-')} readOnly style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#fff', padding: '10px 8px', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Playlist type</label>
                <select style={{ width: '100%', backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '4px' }}>
                  <option>Playlist</option><option>EP</option><option>Album</option><option>Compilation</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Release date</label>
                <input type="date" style={{ width: '100%', backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '9px 10px', borderRadius: '4px', colorScheme: 'dark' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Genre</label>
              <select style={{ width: '100%', backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '4px' }}>
                <option>None</option><option>Hip-hop & Rap</option><option>Electronic</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Additional tags</label>
              <input type="text" placeholder="Add tags to describe the genre and mood of your playlist" style={{ width: '100%', backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Describe your playlist" rows="3" style={{ width: '100%', backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '4px', resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>Privacy:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input type="radio" name="privacy" checked={!editForm.is_private} onChange={() => setEditForm({...editForm, is_private: false})} style={{ marginTop: '3px', accentColor: '#f50' }} />
                  <div>
                    <div style={{ color: '#fff', fontSize: '14px', marginBottom: '2px' }}>Public</div>
                    <div style={{ color: '#999', fontSize: '12px' }}>Anyone will be able to listen to this playlist.</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input type="radio" name="privacy" checked={editForm.is_private} onChange={() => setEditForm({...editForm, is_private: true})} style={{ marginTop: '3px', accentColor: '#f50' }} />
                  <div>
                    <div style={{ color: '#fff', fontSize: '14px', marginBottom: '2px' }}>Private</div>
                    <div style={{ color: '#999', fontSize: '12px' }}>Only you and people you share a secret link with will be able to listen to this track.</div>
                  </div>
                </label>
                
                {editForm.is_private && (
                  <div style={{ marginLeft: '28px', marginTop: '8px', backgroundColor: '#1a1a1a', padding: '12px', borderRadius: '4px', border: '1px solid #333' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ccc', marginBottom: '6px' }}>Secret Link</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={editForm.secret_token ? getSecretLink() : 'Save to generate secret link'} 
                        style={{ flex: 1, backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '8px 10px', borderRadius: '4px', fontSize: '12px', outline: 'none' }} 
                      />
                      <button 
                        onClick={() => navigator.clipboard.writeText(getSecretLink()).then(() => alert('Copied to clipboard!'))}
                        disabled={!editForm.secret_token}
                        style={{ backgroundColor: '#333', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: editForm.secret_token ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        Copy
                      </button>
                    </div>
                    {editForm.secret_token && (
                      <button 
                        onClick={handleRegenerateToken} 
                        disabled={isRegenerating}
                        style={{ background: 'none', border: 'none', color: '#f50', fontSize: '12px', marginTop: '10px', cursor: 'pointer', padding: 0 }}
                      >
                        {isRegenerating ? 'Regenerating...' : 'Reset secret link'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ borderTop: '1px solid #333', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#999', fontWeight: 'bold' }}><span style={{ color: '#f50' }}>*</span> Required fields</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>Cancel</button>
            <button onClick={handleSaveChanges} disabled={isSaving} style={{ backgroundColor: '#f50', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '3px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>{isSaving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
