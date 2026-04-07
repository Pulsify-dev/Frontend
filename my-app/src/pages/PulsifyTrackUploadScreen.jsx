import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { PulsifyAuthVaultContext } from '../store/PulsifyAuthVault';

export const PulsifyTrackUploadScreen = () => {
  const { subscriptionTier } = useContext(PulsifyAuthVaultContext) || { subscriptionTier: 'FREE' };
  const isProUser = subscriptionTier === 'PRO';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111', fontFamily: '"Inter", "Helvetica Neue", sans-serif' }}>
      {/* ─── TOP BAR ─── */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/playlists" style={{ color: '#f50', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Sets
        </Link>
        {!isProUser && (
          <Link to="/premium" style={{ color: '#f50', textDecoration: 'none', fontSize: '13px', border: '1px solid #f50', padding: '6px 14px', borderRadius: '4px' }}>
            Upgrade to Pro
          </Link>
        )}
      </div>

      {/* ─── UPLOAD AREA ─── */}
      <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        
        {!isProUser ? (
          /* ─── FREE USER: LOCKED STATE ─── */
          <div style={{
            border: '2px solid #e22134',
            borderRadius: '12px',
            padding: '60px 40px',
            backgroundColor: 'rgba(226, 33, 52, 0.05)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ color: '#e22134', margin: '0 0 12px', fontSize: '22px', fontWeight: 600 }}>Upload Limit Reached (3/3)</h2>
            <p style={{ color: '#888', margin: '0 0 24px', fontSize: '14px', lineHeight: 1.6 }}>
              Free tier allows a maximum of 3 tracks.<br />
              Upgrade to Artist Pro for unlimited uploads.
            </p>
            <Link to="/premium" style={{
              display: 'inline-block', padding: '12px 32px',
              backgroundColor: '#f50', color: '#fff', textDecoration: 'none',
              borderRadius: '50px', fontSize: '14px', fontWeight: 600,
              transition: 'opacity 0.15s'
            }}>
              Upgrade to Artist Pro
            </Link>
          </div>
        ) : (
          /* ─── PRO USER: STATIC UPLOAD PLACEHOLDER ─── */
          <div style={{
            border: '2px dashed #333',
            borderRadius: '12px',
            padding: '60px 40px',
            backgroundColor: '#1a1a1a'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.4 }}>☁️</div>
            <h2 style={{ color: '#fff', margin: '0 0 8px', fontSize: '22px', fontWeight: 600 }}>Upload to Pulsify</h2>
            <p style={{ color: '#666', margin: '0 0 24px', fontSize: '14px' }}>
              Drag and drop your audio files here (MP3, WAV, High-Bitrate)
            </p>
            <button
              disabled
              style={{
                padding: '12px 32px',
                backgroundColor: '#333',
                color: '#666',
                border: 'none',
                borderRadius: '50px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'not-allowed'
              }}
            >
              Upload
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
