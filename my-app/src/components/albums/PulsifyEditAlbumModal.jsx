import React, { useState, useEffect } from 'react';
import { PulsifyAlbumService } from '../../services/pulsifyAlbumService';

export const PulsifyEditAlbumModal = ({ isOpen, onClose, album, onSaveSuccess }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ 
    title: '', description: '', genre: '', type: 'Album', visibility: 'public', artwork_url: '', permalink: '' 
  });

  useEffect(() => {
    if (isOpen && album) {
      setEditForm({
        title: album.title || '',
        description: album.description || '',
        genre: album.genre || '',
        type: album.type || 'Album',
        visibility: album.visibility || 'public',
        artwork_url: album.artwork_url || '',
        permalink: album.permalink || ''
      });
    }
  }, [isOpen, album]);

  if (!isOpen) return null;

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const albumId = album._id || album.id;
      const updatePayload = {
        title: editForm.title || album.title,
        genre: editForm.genre || album.genre,
        type: editForm.type || album.type,
        visibility: editForm.visibility,
      };
      
      if (editForm.description !== undefined) {
        updatePayload.description = editForm.description;
      }
      
      const result = await PulsifyAlbumService.updateAlbum(albumId, updatePayload);
      
      if (onSaveSuccess) {
        onSaveSuccess({ ...album, ...updatePayload });
      }
      onClose();
    } catch (e) {
      const errorMsg = e.response?.data?.message || e.response?.data?.error || e.message;
      console.error("Save error details:", e.response?.data);
      alert("Failed to save changes: " + errorMsg);
    } finally {
      setIsSaving(false);
    }
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
            <div style={{ width: '100%', aspectRatio: '1/1', background: 'linear-gradient(135deg, #443 0%, #224 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
               {editForm.artwork_url ? <img src={editForm.artwork_url} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : null}
               <button style={{ position: 'absolute', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Upload image</button>
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
                <span style={{ padding: '10px 8px', color: '#999', backgroundColor: '#1a1a1a', fontSize: '13px' }}>pulsify.page/albums/</span>
                <input type="text" value={editForm.title.toLowerCase().replace(/\s+/g, '-')} readOnly style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#fff', padding: '10px 8px', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Album type</label>
                <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} style={{ width: '100%', backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '4px' }}>
                  <option>Album</option><option>EP</option><option>Single</option><option>Compilation</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Release date</label>
                <input type="date" style={{ width: '100%', backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '9px 10px', borderRadius: '4px', colorScheme: 'dark' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Genre <span style={{ color: '#f50' }}>*</span></label>
              <select value={editForm.genre} onChange={e => setEditForm({...editForm, genre: e.target.value})} style={{ width: '100%', backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '4px' }}>
                <option>None</option><option>Electronic</option><option>Hip-hop & Rap</option><option>Pop</option><option>R&B & Soul</option><option>Rock</option><option>Classical</option><option>Jazz</option><option>Lo-Fi</option><option>Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Describe your album" rows="3" style={{ width: '100%', backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '4px', resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>Visibility:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input type="radio" name="album-visibility" checked={editForm.visibility === 'public'} onChange={() => setEditForm({...editForm, visibility: 'public'})} style={{ marginTop: '3px', accentColor: '#f50' }} />
                  <div>
                    <div style={{ color: '#fff', fontSize: '14px', marginBottom: '2px' }}>Public</div>
                    <div style={{ color: '#999', fontSize: '12px' }}>Anyone will be able to listen to this album.</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input type="radio" name="album-visibility" checked={editForm.visibility === 'private'} onChange={() => setEditForm({...editForm, visibility: 'private'})} style={{ marginTop: '3px', accentColor: '#f50' }} />
                  <div>
                    <div style={{ color: '#fff', fontSize: '14px', marginBottom: '2px' }}>Private</div>
                    <div style={{ color: '#999', fontSize: '12px' }}>Only you will be able to see and listen to this album.</div>
                  </div>
                </label>
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
