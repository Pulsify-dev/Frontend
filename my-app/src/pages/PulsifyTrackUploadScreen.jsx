import React, { useState, useRef, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PulsifyAuthVaultContext } from '../store/PulsifyAuthVault';
import { PulsifyTrackService } from '../services/pulsifyTrackService';
import { PulsifyMetadataForm } from '../components/upload/PulsifyMetadataForm';
import '../components/upload/css/PulsifyUploads.css';

export const PulsifyTrackUploadScreen = () => {
  const { subscriptionTier } = useContext(PulsifyAuthVaultContext) || { subscriptionTier: 'FREE' };
  const isProUser = true;
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
            <span style={{ color: '#7c3aed', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.5px' }}>Pulsify</span>
            Upload
          </h1>
          <Link to="/" className="pulsify-upload-close">✕</Link>
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
            <span style={{ color: '#7c3aed', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.5px' }}>Pulsify</span>
            Upload
          </h1>
          <Link to="/" className="pulsify-upload-close">✕</Link>
        </div>
        <div className="pulsify-upload-body" style={{ textAlign: 'center', paddingTop: '80px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 24px',
            background: '#1a1a1a', border: '2px solid #333',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ color: '#7c3aed', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.5px' }}>P</span>
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
          <span style={{ color: '#7c3aed', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>Pulsify</span>
          {selectedFile ? 'Track Info' : 'Upload'}
        </h1>
        {selectedFile && (
          <div className="pulsify-replace-track">
            <div className="replace-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <span className="replace-name">{selectedFile.name}</span>
            <button onClick={handleReplaceTrack}>Replace track</button>
          </div>
        )}
        <Link to="/" className="pulsify-upload-close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 10.94 7.05 5.99 5.99 7.05 10.94 12l-4.95 4.95 1.06 1.06L12 13.06l4.95 4.95 1.06-1.06L13.06 12l4.95-4.95-1.06-1.06L12 10.94Z"/>
          </svg>
        </Link>
      </div>

      <div className="pulsify-upload-body">

        {!selectedFile ? (
          <>
            <div className="pulsify-upload-usage-bar">
              <div className="usage-left">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="usage-cloud-icon">
                  <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                    <path d="M9 19.5H6.75a5.25 5.25 0 1 1 1.3-10.34"/>
                    <path d="M7.5 12A7.5 7.5 0 1 1 21 16.5"/>
                    <path d="M11.07 15.18 14.25 12l3.18 3.18m-3.18 4.32V12"/>
                  </g>
                </svg>
                <div className="usage-text-stack">
                  <span className="usage-title">0% of uploads used</span>
                  <span className="usage-upgrade-link">Get unlimited uploads</span>
                </div>
              </div>
              <div className="usage-center">
                <div className="usage-progress">
                  <div className="usage-progress-bar" style={{ width: '0.5%' }}></div>
                </div>
                <span className="usage-minutes">0 of 180 minutes</span>
              </div>
              <Link to="/premium" className="usage-cta">Get unlimited uploads</Link>
            </div>

            <h2>Upload your audio files.</h2>
            <p className="format-note">
              For best quality, use WAV, FLAC, or AAC. The maximum file size is 30MB. <a href="#" className="learn-more">Learn more.</a>
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
                <svg width="69" height="72" fill="none" viewBox="0 0 69 72" className="drop-cloud-svg">
                  <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 52H12a16 16 0 1 1 4-31"/>
                    <path d="M15 36a23 23 0 1 1 41 14"/>
                    <path d="M30 44l10-10 10 10"/>
                    <line x1="40" y1="34" x2="40" y2="58"/>
                  </g>
                  <circle cx="52" cy="18" r="2" fill="currentColor" opacity="0.3"/>
                  <circle cx="58" cy="28" r="1.5" fill="currentColor" opacity="0.2"/>
                  <circle cx="22" cy="22" r="1.5" fill="currentColor" opacity="0.2"/>
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

            <div className="pulsify-mic-section">
              <div className="mic-icon-area">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <div className="mic-content">
                <div className="mic-title">Or record with a microphone</div>
                <div className="mic-desc">Upload recorded voice memos, updates, news, or intros to new releases.</div>
              </div>
              <svg className="mic-chevron" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="m10 3.94 7.53 7.53a.75.75 0 0 1 0 1.06L10 20.06 8.94 19l7-7-7-7L10 3.94Z" transform="rotate(90, 12, 12)"/>
              </svg>
            </div>

            <div className="pulsify-upload-page-footer">
              <a href="/terms">Legal</a>
              <span>·</span>
              <a href="/privacy">Privacy</a>
              <span>·</span>
              <a href="/terms">Cookie Policy</a>
              <span>·</span>
              <a href="#">Cookie Manager</a>
              <span>·</span>
              <a href="#">Imprint</a>
              <span>·</span>
              <a href="#">About us</a>
              <span>·</span>
              <a href="#">Copyright</a>
              <span>·</span>
              <a href="#">Feedback</a>
            </div>
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
            By uploading, you confirm that your sounds comply with our <a href="/terms">Terms of Use</a> and you don't infringe anyone else's rights.
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
