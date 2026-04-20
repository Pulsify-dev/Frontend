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
            <span style={{ color: '#7c3aed', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>Pulsify</span>
            Upload
          </h1>
          <Link to="/" className="pulsify-upload-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 10.94 7.05 5.99 5.99 7.05 10.94 12l-4.95 4.95 1.06 1.06L12 13.06l4.95 4.95 1.06-1.06L13.06 12l4.95-4.95-1.06-1.06L12 10.94Z"/>
            </svg>
          </Link>
        </div>
        <div className="pulsify-upload-body pulsify-success-screen">
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 className="success-title">Saved to Pulsify.</h2>
          <p className="success-subtitle">Your track "{uploadedTrack.title}" is now live on Pulsify.</p>
          <div className="success-track-card">
            <img 
              src={uploadedTrack.artwork_url} 
              alt={uploadedTrack.title} 
              className="success-track-art"
            />
            <div className="success-track-info">
              <span className="success-track-title">{uploadedTrack.title}</span>
              <span className="success-track-genre">{uploadedTrack.genre}</span>
            </div>
          </div>
          <div className="success-actions">
            <button
              onClick={() => navigate(`/tracks/${uploadedTrack._id}`)}
              className="success-btn success-btn-primary"
            >
              View track
            </button>
            <button
              onClick={handleReplaceTrack}
              className="success-btn success-btn-secondary"
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
                <svg width="69" height="72" fill="none" viewBox="0 0 69 72">
                  <g clipPath="url(#dropIcon)">
                    <path d="M26.405 8.21c.06-.13.13-.26.2-.38.16-.31.33-.61.51-.9.08-.13.15-.25.23-.38.22-.33.44-.66.68-.97.04-.05.08-.11.12-.17.28-.36.57-.69.88-1.02.08-.09.17-.17.26-.26.23-.23.47-.46.71-.67.11-.09.21-.18.32-.27.27-.22.54-.42.82-.61.08-.06.16-.12.24-.17.26-.17.53-.32.81-.47.14-.08.26-.16.4-.23.41-.21.84-.4 1.27-.56l-13.92 5.19c-.43.16-.86.35-1.27.56-.14.07-.27.16-.4.23-.25.14-.5.27-.74.42-.02.02-.05.04-.07.05-.08.05-.16.11-.24.17-.28.19-.55.4-.82.61-.11.09-.21.18-.32.27-.24.21-.48.44-.71.67-.09.09-.18.17-.26.26-.3.32-.6.66-.88 1.02-.04.05-.08.11-.12.17a13.928 13.928 0 0 0-.91 1.34c-.18.29-.35.59-.51.9-.07.13-.14.25-.2.38-.21.43-.13.27-.31.73M56.155 51.7l-17.09-3.93-9.77-2.24c-5.7-1.31-10.64-6.41-13.08-12.75-1.02-2.66-1.6-5.55-1.61-8.46-.01-5.97 2.38-10.7 6.07-13.09.65-.42 1.34-.77 2.06-1.04l-13.92 5.19c-.72.27-1.41.62-2.06 1.04-3.69 2.39-6.08 7.12-6.06 13.09 0 2.91.58 5.8 1.61 8.46 2.43 6.34 7.38 11.44 13.08 12.75l9.77 2.24 17.09 3.93c1.94.45 3.77.32 5.4-.29l13.92-5.19c-1.63.61-3.46.74-5.4.29h-.01z" stroke="currentColor" strokeMiterlimit="10"/>
                    <path d="M58.395 22.75c-1.12-10.48-8.3-20.01-16.99-22.01-6.98-1.6-12.96 2.11-15.61 8.8-6.44.4-11.21 6.36-11.19 14.78.02 9.86 6.59 19.35 14.68 21.21l9.77 2.24v-5.43l4.88 1.12v-5.43l4.88 1.12v5.43l-4.88-1.12v5.43l12.21 2.81c6.74 1.55 12.19-3.85 12.18-12.07-.01-7.25-4.29-14.28-9.94-16.88h.01zm-9.06 8.9-5.39-7.79v14.18l-4.88-1.12V22.74l-5.36 5.31-3.46-5 7.65-7.59c1.87-1.85 4.83-1.76 7.33 1.85l7.56 10.93-3.44 3.41h-.01zM4.895 42.95l12.13-4.52c-.77-1.14-1.46-2.36-2.05-3.65L2.845 39.3c.58 1.29 1.27 2.51 2.04 3.65h.01zM34.185 52.09l4.88 1.12v5.43l-4.88-1.12v-5.43zM39.065 66.43l3.45.79v3.84l-3.45-.79v-3.84z" fill="currentColor"/>
                    <path d="M58.395 22.75c-1.11-10.48-8.3-20.01-16.99-22.01-6.98-1.6-12.96 2.11-15.61 8.8-6.44.4-11.21 6.36-11.19 14.78.02 9.86 6.59 19.35 14.68 21.21l9.77 2.24 4.88 1.12 12.22 2.81c6.74 1.55 12.19-3.85 12.18-12.07-.01-7.25-4.29-14.28-9.94-16.88z" stroke="currentColor" strokeMiterlimit="10"/>
                  </g>
                  <defs>
                    <clipPath id="dropIcon">
                      <path fill="#fff" transform="translate(.315)" d="M0 0h68.4v71.06H0z"/>
                    </clipPath>
                  </defs>
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
            {(isUploading || transcodingStatus === 'processing') && (
              <div className="pulsify-upload-progress-section">
                <div className="progress-header">
                  <div className="progress-status">
                    {transcodingStatus === 'processing' ? (
                      <>
                        <span className="progress-spinner"></span>
                        <span>Processing your track...</span>
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <span>Uploading...</span>
                      </>
                    )}
                  </div>
                  <span className="progress-percent">{uploadProgress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
                {transcodingStatus === 'processing' && (
                  <p className="progress-hint">Your file is being transcoded. This usually takes a few seconds.</p>
                )}
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
