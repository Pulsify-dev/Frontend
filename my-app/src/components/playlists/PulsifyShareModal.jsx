import React, { useState, useEffect } from 'react';
import { PulsifyPlaylistService } from '../../services/pulsifyPlaylistService';

export const PulsifyShareModal = ({ isOpen, onClose, playlist }) => {
  const [activeTab, setActiveTab] = useState('Embed');
  const [embedCode, setEmbedCode] = useState('Loading...');
  const [color, setColor] = useState('#ff5500');
  const [height, setHeight] = useState('300px');
  
  useEffect(() => {
    if (isOpen && playlist && activeTab === 'Embed') {
      const fetchEmbed = async () => {
        try {
          const playlistId = playlist._id || playlist.id;
          const res = await PulsifyPlaylistService.getEmbedCode(playlistId);
          let code = res?.data?.embedCode || res?.embedCode || res?.html || '';
          if (!code) {
            // Fallback generated code
            const baseUrl = window.location.origin;
            const permalink = playlist.permalink || playlist.title?.toLowerCase().replace(/\s+/g, '-');
            const tokenQuery = playlist.is_private && playlist.secret_token ? `?token=${playlist.secret_token}` : '';
            const colorQuery = tokenQuery ? `&color=${color.replace('#', '%23')}` : `?color=${color.replace('#', '%23')}`;
            code = `<iframe width="100%" height="${height}" scrolling="no" frameborder="no" allow="autoplay" src="${baseUrl}/playlists/embed/${permalink}${tokenQuery}${colorQuery}"></iframe>`;
          } else {
            // Force the iframe to use the local frontend domain during testing
            // instead of the hardcoded 'https://pulsify.page' from the backend
            const baseUrl = window.location.origin;
            code = code.replace(/https:\/\/pulsify\.page/g, baseUrl);

            // Modify height
            code = code.replace(/height="[^"]+"/, `height="${height}"`);
            // Safely inject color into the src attribute
            const srcMatch = code.match(/src="([^"]+)"/);
            if (srcMatch) {
              let srcUrl = srcMatch[1];
              srcUrl = srcUrl.includes('?') ? `${srcUrl}&color=${color.replace('#', '%23')}` : `${srcUrl}?color=${color.replace('#', '%23')}`;
              code = code.replace(/src="[^"]+"/, `src="${srcUrl}"`);
            }
          }
          setEmbedCode(code);
        } catch (err) {
          console.error("Failed to get embed code", err);
          setEmbedCode('Failed to generate embed code.');
        }
      };
      fetchEmbed();
    }
  }, [isOpen, playlist, activeTab, color, height]);

  if (!isOpen || !playlist) return null;

  const getShareLink = () => {
    const baseUrl = window.location.origin;
    const identifier = playlist.permalink || playlist._id || playlist.id;
    if (playlist.is_private && playlist.secret_token) {
      return `${baseUrl}/playlists/${identifier}?token=${playlist.secret_token}`;
    }
    return `${baseUrl}/playlists/${identifier}`;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter", sans-serif'
    }}>
      <div style={{
        backgroundColor: '#111', width: '800px', borderRadius: '4px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)', position: 'relative'
      }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', zIndex: 10
          }}
        >
          &times;
        </button>

        {/* Header Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #333', padding: '0 24px', gap: '30px' }}>
          {['Share', 'Embed', 'Message'].map(tab => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                padding: '24px 0', 
                color: activeTab === tab ? '#fff' : '#999', 
                fontSize: '18px', 
                fontWeight: 'bold',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '3px solid #f50' : '3px solid transparent',
                marginBottom: '-1px'
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px', display: 'flex', gap: '30px', maxHeight: '75vh', overflowY: 'auto' }}>
          
          {activeTab === 'Embed' && (
            <>
              {/* Left Column: Player Previews (Mock) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ width: '120px', height: '120px', border: '2px solid #f50', borderRadius: '4px', overflow: 'hidden', padding: '4px', cursor: 'pointer' }}>
                   <div style={{ width: '100%', height: '100%', backgroundColor: '#222', display: 'flex', flexDirection: 'column' }}>
                     <div style={{ flex: 1, backgroundColor: '#333' }}></div>
                     <div style={{ height: '30px', backgroundColor: '#444' }}></div>
                   </div>
                </div>
                <div style={{ width: '120px', height: '120px', border: '2px solid transparent', borderRadius: '4px', overflow: 'hidden', padding: '4px', cursor: 'pointer', opacity: 0.5 }}>
                   <div style={{ width: '100%', height: '100%', backgroundColor: '#222', display: 'flex' }}>
                     <div style={{ width: '40px', height: '100%', backgroundColor: '#333' }}></div>
                     <div style={{ flex: 1, backgroundColor: '#444' }}></div>
                   </div>
                </div>
              </div>

              {/* Right Column: Code & Options */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div>
                  <label style={{ display: 'block', color: '#fff', fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>Code</label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      readOnly 
                      value={embedCode}
                      onClick={e => e.target.select()}
                      style={{ flex: 1, backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}
                    />
                    <a href="#" style={{ color: '#60b8ff', fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}>WordPress code</a>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#fff', fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>Options</label>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '16px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#ccc', fontSize: '13px', fontWeight: 'bold' }}>Color:</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['#f50', '#ff0000', '#990000', '#550000'].map(c => (
                          <div 
                            key={c}
                            onClick={() => setColor(c)}
                            style={{ width: '20px', height: '20px', backgroundColor: c, cursor: 'pointer', border: color === c ? '2px solid #fff' : '2px solid transparent' }}
                          />
                        ))}
                      </div>
                      <input 
                        type="text" 
                        value={color} 
                        onChange={e => setColor(e.target.value)}
                        style={{ width: '70px', backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '4px 6px', borderRadius: '2px', fontSize: '12px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#ccc', fontSize: '13px', fontWeight: 'bold' }}>Height:</span>
                      <select 
                        value={height}
                        onChange={e => setHeight(e.target.value)}
                        style={{ backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '4px 8px', borderRadius: '2px', fontSize: '12px' }}
                      >
                        <option value="300px">300px</option>
                        <option value="450px">450px</option>
                        <option value="600px">600px</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#999', fontSize: '13px' }}>
                      <input type="checkbox" style={{ accentColor: '#f50' }} />
                      Enable automatic play
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#ccc', fontSize: '13px' }}>
                      <input type="checkbox" defaultChecked style={{ accentColor: '#f50' }} />
                      Show comments
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#ccc', fontSize: '13px' }}>
                      <input type="checkbox" defaultChecked style={{ accentColor: '#f50' }} />
                      Show display names
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#ccc', fontSize: '13px' }}>
                      <input type="checkbox" defaultChecked style={{ accentColor: '#f50' }} />
                      Show Pulsify overlays
                    </label>
                  </div>
                </div>

                {/* Live Preview (Mock up) */}
                <div style={{ marginTop: '16px', backgroundColor: '#fff', borderRadius: '4px', overflow: 'hidden', height: height, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', height: '140px', padding: '16px', gap: '16px' }}>
                    <div style={{ width: '108px', height: '108px', flexShrink: 0, position: 'relative' }}>
                      <img src={playlist.cover_url || 'https://placehold.co/108'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ width: '40px', height: '40px', backgroundColor: color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><polygon points="8,5 19,12 8,19"/></svg>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{playlist.creator_id?.display_name || playlist.creator_username || 'User'}</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{playlist.title}</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ width: '100%', height: '40px', backgroundColor: '#eee', borderRadius: '2px', display: 'flex', gap: '1px', alignItems: 'center', padding: '0 4px' }}>
                          {/* Fake waveform */}
                          {Array.from({length: 60}).map((_, i) => (
                            <div key={i} style={{ flex: 1, height: `${Math.random() * 80 + 20}%`, backgroundColor: i < 15 ? color : '#ccc' }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Fake tracklist area */}
                  <div style={{ flex: 1, backgroundColor: '#f2f2f2', borderTop: '1px solid #e5e5e5', padding: '8px' }}>
                    {playlist.tracks?.slice(0, 3).map((t, i) => (
                      <div key={i} style={{ padding: '6px', fontSize: '12px', color: '#333', borderBottom: '1px solid #e5e5e5' }}>
                        {i + 1}. {(t.track_id && t.track_id.title) || t.title || 'Track Title'}
                      </div>
                    ))}
                    {(playlist.tracks?.length || 0) > 3 && (
                      <div style={{ padding: '6px', fontSize: '12px', color: '#999' }}>... and {(playlist.tracks?.length || 0) - 3} more</div>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}

          {activeTab === 'Share' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '20px 0' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={getShareLink()}
                  onClick={e => e.target.select()}
                  style={{ flex: 1, backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '4px', fontSize: '14px' }}
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(getShareLink());
                    alert('Copied to clipboard!');
                  }}
                  style={{ backgroundColor: '#f50', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Copy
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'Message' && (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#666', height: '200px' }}>
              Direct messaging coming soon!
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
