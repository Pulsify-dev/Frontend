import React, { useState, useRef, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PulsifyAuthVaultContext } from '../store/PulsifyAuthVault';
import { PulsifyTrackService } from '../services/pulsifyTrackService';
import { PulsifyMetadataForm } from '../components/upload/PulsifyMetadataForm';
import '../components/upload/css/PulsifyUploads.css';

export const PulsifyTrackUploadScreen = () => {
  const { subscriptionTier } = useContext(PulsifyAuthVaultContext) || { subscriptionTier: 'FREE' };
  const isProUser = subscriptionTier === 'PRO' || subscriptionTier === 'GO_PLUS';
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [artworkFile, setArtworkFile] = useState(null);
  const [artworkPreview, setArtworkPreview] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transcodingStatus, setTranscodingStatus] = useState(null);
  const [uploadedTrack, setUploadedTrack] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileValidation = useCallback((file) => {
    setFileError(null);
    const validation = PulsifyTrackService.validateAudioFile(file);
    if (!validation.valid) {
      setFileError(validation.error);
      return false;
    }
    return true;
  }, []);

  const handleFileSelect = useCallback((file) => {
    if (handleFileValidation(file)) {
      setSelectedFile(file);
      setFileError(null);
    }
  }, [handleFileValidation]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  };

  const handleArtworkSelect = (file) => {
    setArtworkFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setArtworkPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleReplaceTrack = () => {
    setSelectedFile(null);
    setArtworkFile(null);
    setArtworkPreview(null);
    setUploadedTrack(null);
    setTranscodingStatus(null);
    setUploadProgress(0);
    setUploadError(null);
    fileInputRef.current.value = '';
  };

  const handleUploadSubmit = async (metadata) => {
    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);
      setTranscodingStatus(null);

      const formData = new FormData();
      formData.append('audio_file', selectedFile);
      if (artworkFile) formData.append('artwork_file', artworkFile);
      formData.append('title', metadata.title);
      formData.append('genre', metadata.genre);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.tags && metadata.tags.length > 0) {
        metadata.tags.forEach(tag => formData.append('tags', tag));
      }

      const track = await PulsifyTrackService.createTrack(formData, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(pct);
      });

      setUploadedTrack(track);

      if (track.status === 'processing') {
        setTranscodingStatus('processing');
        pollTranscoding(track._id);
      } else {
        setTranscodingStatus('finished');
      }

      if (metadata.visibility === 'private') {
        await PulsifyTrackService.updateTrackMetadata(track._id, { visibility: 'private' });
      }

    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const pollTranscoding = async (trackId) => {
    const interval = setInterval(async () => {
      try {
        const status = await PulsifyTrackService.pollTrackStatus(trackId);
        if (status.status === 'finished') {
          setTranscodingStatus('finished');
          clearInterval(interval);
        } else if (status.status === 'failed') {
          setTranscodingStatus('failed');
          setUploadError(status.error_message || 'Transcoding failed.');
          clearInterval(interval);
        } else {
          setUploadProgress(status.progress_percent || 0);
        }
      } catch (err) {
        setTranscodingStatus('failed');
        setUploadError('Failed to check transcoding status.');
        clearInterval(interval);
      }
    }, 3000);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isProUser) {
    return (
      <div className="pulsify-upload-page">
        <div className="pulsify-upload-header">
          <h1>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="14" width="3" height="7" rx="1"/><rect x="8" y="10" width="3" height="11" rx="1"/><rect x="13" y="6" width="3" height="15" rx="1"/><rect x="18" y="2" width="3" height="19" rx="1"/></svg>
            Upload
          </h1>
          <Link to="/playlists" className="pulsify-upload-close">✕</Link>
        </div>
        <div className="pulsify-locked-upload">
          <div className="lock-icon">🔒</div>
          <h2>Upload Limit Reached (3/3)</h2>
          <p>
            Free tier allows a maximum of 3 tracks.<br />
            Upgrade to Artist Pro for unlimited uploads.
          </p>
          <Link to="/premium" className="upgrade-btn">Upgrade to Artist Pro</Link>
        </div>
      </div>
    );
  }

  if (transcodingStatus === 'finished' && uploadedTrack) {
    return (
      <div className="pulsify-upload-page">
        <div className="pulsify-upload-header">
          <h1>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="14" width="3" height="7" rx="1"/><rect x="8" y="10" width="3" height="11" rx="1"/><rect x="13" y="6" width="3" height="15" rx="1"/><rect x="18" y="2" width="3" height="19" rx="1"/></svg>
            Upload
          </h1>
          <Link to="/playlists" className="pulsify-upload-close">✕</Link>
        </div>
        <div className="pulsify-upload-body" style={{ textAlign: 'center', paddingTop: '80px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 24px',
            background: '#1a1a1a', border: '2px solid #333',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="#f50">
              <rect x="3" y="14" width="3" height="7" rx="1"/>
              <rect x="8" y="10" width="3" height="11" rx="1"/>
              <rect x="13" y="6" width="3" height="15" rx="1"/>
              <rect x="18" y="2" width="3" height="19" rx="1"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px' }}>Saved to Pulsify.</h2>
          <p style={{ color: '#888', fontSize: '15px', margin: '0 0 28px' }}>
            Your track is now on Pulsify.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/playlists')}
              style={{
                padding: '10px 24px', background: '#333', color: '#fff',
                border: '1px solid #555', borderRadius: '4px', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              View track
            </button>
            <button
              onClick={handleReplaceTrack}
              style={{
                padding: '10px 24px', background: 'transparent', color: '#aaa',
                border: '1px solid #333', borderRadius: '4px', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              Upload another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pulsify-upload-page">
      <div className="pulsify-upload-header">
        <h1>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="14" width="3" height="7" rx="1"/><rect x="8" y="10" width="3" height="11" rx="1"/><rect x="13" y="6" width="3" height="15" rx="1"/><rect x="18" y="2" width="3" height="19" rx="1"/></svg>
          {selectedFile ? 'Track Info' : 'Upload'}
        </h1>
        {selectedFile && (
          <div className="pulsify-replace-track">
            <span className="replace-name">{selectedFile.name}</span>
            <button onClick={handleReplaceTrack}>Replace track</button>
          </div>
        )}
        <Link to="/playlists" className="pulsify-upload-close">✕</Link>
      </div>

      <div className="pulsify-upload-usage-bar">
        <div className="usage-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          0% of uploads used
        </div>
        <span>0 of 180 minutes</span>
        <Link to="/premium" className="usage-cta">Get unlimited uploads</Link>
      </div>

      <div className="pulsify-upload-body">

        {!selectedFile ? (
          <>
            <h2>Upload your audio files.</h2>
            <p className="format-note">
              For best quality, use WAV, FLAC, or AAC. The maximum file size is 30MB.
            </p>

            <div
              className={`pulsify-dropzone ${isDragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="drop-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p className="drop-text">Drag and drop audio files to get started.</p>
              <span className="choose-btn">Choose files</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.flac,.aac,audio/mpeg,audio/wav,audio/flac,audio/aac"
                onChange={handleInputChange}
              />
            </div>

            {fileError && (
              <div className="pulsify-upload-error">
                <span>⚠</span> {fileError}
              </div>
            )}
          </>
        ) : (
          <>
            {isUploading && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888', marginBottom: '8px' }}>
                  <span>{transcodingStatus === 'processing' ? 'Processing...' : 'Uploading...'}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${uploadProgress}%`, height: '100%',
                    background: 'linear-gradient(90deg, #f50, #ff8a00)',
                    borderRadius: '2px', transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            {uploadError && (
              <div className="pulsify-upload-error" style={{ marginBottom: '24px' }}>
                <span>⚠</span> {uploadError}
              </div>
            )}

            <PulsifyMetadataForm
              file={selectedFile}
              artworkPreview={artworkPreview}
              onArtworkSelect={handleArtworkSelect}
              onSubmit={handleUploadSubmit}
              isUploading={isUploading}
            />
          </>
        )}
      </div>

      {selectedFile && (
        <div className="pulsify-upload-footer">
          <div className="footer-terms">
            By uploading, you confirm that your sounds comply with our Terms of Use and you don't infringe anyone else's rights.
          </div>
          <button
            type="submit"
            form="pulsify-metadata-form"
            className="upload-submit-btn"
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}
    </div>
  );
};
