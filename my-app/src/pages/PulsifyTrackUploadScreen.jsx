import React, { useState, useRef, useContext, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PulsifyAuthVaultContext } from '../store/PulsifyAuthVault';
import { PulsifyTrackService } from '../services/pulsifyTrackService';
import { PulsifyAlbumService } from '../services/pulsifyAlbumService';
import { PulsifyPremiumService } from '../services/pulsifyPremiumService';
import { PulsifyMetadataForm } from '../components/upload/PulsifyMetadataForm';
import '../components/upload/css/PulsifyUploads.css';
import '../components/premium/css/PulsifyPremium.css';

export const PulsifyTrackUploadScreen = () => {
  const { subscriptionTier } = useContext(PulsifyAuthVaultContext) || {
    subscriptionTier: "FREE",
  };
  const isPro = subscriptionTier === "PRO";
  const navigate = useNavigate();

  // Usage state
  const [usageData, setUsageData] = useState(null);
  const [usageLoading, setUsageLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const data = await PulsifyPremiumService.getMyUsage();
        console.log("[Upload] Usage data:", data);
        setUsageData(data);
      } catch (e) {
        console.warn("[Upload] Failed to fetch usage:", e);
      }
      setUsageLoading(false);
    };
    fetchUsage();
  }, [subscriptionTier]);

  const trackUsed = usageData?.usage?.uploaded_tracks?.used ?? 0;
  const trackLimit =
    usageData?.usage?.uploaded_tracks?.limit ?? (isPro ? null : 10);
  const trackRemaining =
    usageData?.usage?.uploaded_tracks?.remaining ??
    (isPro ? null : Math.max(0, 10 - trackUsed));
  const isAtLimit =
    !isPro &&
    trackLimit !== null &&
    trackRemaining !== null &&
    trackRemaining <= 0;
  const isProUser = isPro || !isAtLimit;

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
  const pollingRef = useRef(null);

  // Album mode: triggered when multiple files are dropped
  const [albumMode, setAlbumMode] = useState(false);
  const [albumFiles, setAlbumFiles] = useState([]);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumGenre, setAlbumGenre] = useState('');
  const [albumType, setAlbumType] = useState('Album');
  const [albumDescription, setAlbumDescription] = useState('');
  const [albumVisibility, setAlbumVisibility] = useState('public');
  const [albumArtwork, setAlbumArtwork] = useState(null);
  const [albumArtworkPreview, setAlbumArtworkPreview] = useState(null);
  const [albumUploading, setAlbumUploading] = useState(false);
  const [albumUploadProgress, setAlbumUploadProgress] = useState(0);
  const [albumUploadedResult, setAlbumUploadedResult] = useState(null);
  const albumArtworkInputRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleFileValidation = useCallback((file) => {
    setFileError(null);
    const validation = PulsifyTrackService.validateAudioFile(file);
    if (!validation.valid) {
      setFileError(validation.error);
      return false;
    }
    return true;
  }, []);

  const handleFileSelect = useCallback(
    (file) => {
      if (handleFileValidation(file)) {
        setSelectedFile(file);
        setFileError(null);
      }
    },
    [handleFileValidation],
  );

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
    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(f => /\.(mp3|wav|flac|aac|ogg|m4a)$/i.test(f.name) || f.type.startsWith('audio/'));

    if (audioFiles.length > 1) {
      // Multiple audio files → album mode
      setAlbumMode(true);
      setAlbumFiles(audioFiles);
      setAlbumTitle('');
      return;
    }

    const file = audioFiles[0] || files[0];
    if (file) handleFileSelect(file);
  };

  const handleInputChange = (e) => {
    const files = Array.from(e.target.files);
    const audioFiles = files.filter(f => /\.(mp3|wav|flac|aac|ogg|m4a)$/i.test(f.name) || f.type.startsWith('audio/'));

    if (audioFiles.length > 1) {
      setAlbumMode(true);
      setAlbumFiles(audioFiles);
      setAlbumTitle('');
      return;
    }

    const file = audioFiles[0] || files[0];
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
    fileInputRef.current.value = "";
  };

  const handleUploadSubmit = async (metadata) => {
    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);
      setTranscodingStatus(null);

      const formData = new FormData();
      formData.append("audio_file", selectedFile);
      if (artworkFile) formData.append("artwork_file", artworkFile);
      formData.append("title", metadata.title);
      formData.append("genre", metadata.genre);
      if (metadata.description)
        formData.append("description", metadata.description);
      if (metadata.tags && metadata.tags.length > 0) {
        metadata.tags.forEach((tag) => formData.append("tags", tag));
      }

      const track = await PulsifyTrackService.createTrack(
        formData,
        (progressEvent) => {
          const pct = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(pct);
        },
      );

      setUploadedTrack(track);

      if (track.status === "processing") {
        setTranscodingStatus("processing");
        pollTranscoding(track._id);
      } else {
        setTranscodingStatus("finished");
      }

      if (metadata.visibility === "private") {
        await PulsifyTrackService.updateTrackMetadata(track._id, {
          visibility: "private",
        });
      }
    } catch (err) {
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const pollTranscoding = async (trackId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const status = await PulsifyTrackService.pollTrackStatus(trackId);
        if (status.status === "finished") {
          setTranscodingStatus("finished");
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        } else if (status.status === "failed") {
          setTranscodingStatus("failed");
          setUploadError(status.error_message || "Transcoding failed.");
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        } else {
          setUploadProgress(status.progress_percent || 0);
        }
      } catch (err) {
        setTranscodingStatus("failed");
        setUploadError("Failed to check transcoding status.");
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 3000);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // ──── ALBUM UPLOAD HANDLERS ────
  const handleAlbumArtworkSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAlbumArtwork(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAlbumArtworkPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleAlbumSubmit = async () => {
    if (!albumTitle.trim()) {
      alert('Please enter an album title.');
      return;
    }
    if (!albumGenre) {
      alert('Please select a genre.');
      return;
    }
    try {
      setAlbumUploading(true);
      setAlbumUploadProgress(0);

      // Step 1: Upload each track individually first
      const trackIds = [];
      for (let i = 0; i < albumFiles.length; i++) {
        const file = albumFiles[i];
        setAlbumUploadProgress(Math.round(((i) / albumFiles.length) * 80));
        const formData = new FormData();
        formData.append('audio_file', file);
        formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
        formData.append('genre', albumGenre);
        const result = await PulsifyTrackService.createTrack(formData);
        const trackId = result._id || result.id || result.data?._id;
        if (trackId) trackIds.push(trackId);
      }

      setAlbumUploadProgress(85);

      // Step 2: Create the album with those track IDs
      const albumPayload = {
        title: albumTitle.trim(),
        genre: albumGenre,
        type: albumType,
        visibility: albumVisibility,
        track_ids: trackIds,
      };
      if (albumDescription.trim()) albumPayload.description = albumDescription.trim();
      if (albumArtwork) albumPayload.artwork = albumArtwork;

      const albumResult = await PulsifyAlbumService.createAlbum(albumPayload);
      setAlbumUploadProgress(100);

      const created = albumResult.album || albumResult.data || albumResult;
      setAlbumUploadedResult(created);
    } catch (err) {
      console.error('[AlbumUpload] Failed:', err);
      alert('Album upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setAlbumUploading(false);
    }
  };

  const handleAlbumReset = () => {
    setAlbumMode(false);
    setAlbumFiles([]);
    setAlbumTitle('');
    setAlbumGenre('');
    setAlbumType('Album');
    setAlbumDescription('');
    setAlbumVisibility('public');
    setAlbumArtwork(null);
    setAlbumArtworkPreview(null);
    setAlbumUploading(false);
    setAlbumUploadProgress(0);
    setAlbumUploadedResult(null);
  };

  if (isAtLimit) {
    return (
      <div className="pulsify-upload-page">
        <div className="pulsify-upload-header">
          <h1>
            <span
              style={{
                color: "#7c3aed",
                fontWeight: 800,
                fontSize: "16px",
                letterSpacing: "-0.5px",
              }}
            >
              Pulsify
            </span>
            Upload
          </h1>
          <Link to="/" className="pulsify-upload-close">
            ✕
          </Link>
        </div>
        <div className="pulsify-paywall-overlay">
          <div className="paywall-icon">🔒</div>
          <h2>
            Upload Limit Reached ({trackUsed}/{trackLimit})
          </h2>
          <p>
            Free tier allows a maximum of {trackLimit} tracks.
            <br />
            Upgrade to Artist Pro for unlimited uploads.
          </p>
          <Link to="/premium" className="paywall-btn">
            Upgrade to Artist Pro →
          </Link>
        </div>
      </div>
    );
  }

  // ──── ALBUM MODE RENDER ────
  if (albumMode) {
    // Success state
    if (albumUploadedResult) {
      return (
        <div className="pulsify-upload-page">
          <div className="pulsify-upload-header">
            <h1>
              <span style={{ color: '#7c3aed', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>Pulsify</span>
              Album
            </h1>
            <Link to="/" className="pulsify-upload-close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.94 7.05 5.99 5.99 7.05 10.94 12l-4.95 4.95 1.06 1.06L12 13.06l4.95 4.95 1.06-1.06L13.06 12l4.95-4.95-1.06-1.06L12 10.94Z" /></svg>
            </Link>
          </div>
          <div className="pulsify-upload-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💿</div>
            <h2 style={{ color: '#fff', marginBottom: '8px' }}>Album Created!</h2>
            <p style={{ color: '#999', marginBottom: '24px' }}>"{albumUploadedResult.title}" with {albumFiles.length} tracks has been uploaded.</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => navigate(`/albums/${albumUploadedResult._id || albumUploadedResult.id}`)} className="success-btn-outline" style={{ padding: '10px 24px', fontSize: '14px' }}>View Album</button>
              <button onClick={handleAlbumReset} className="success-btn-outline" style={{ padding: '10px 24px', fontSize: '14px' }}>Upload More</button>
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
            Album info
          </h1>
          {albumUploading && (
            <div className="pulsify-header-upload-progress">
              <span className="replace-name">{albumFiles.length} tracks</span>
              <div className="usage-progress-small">
                <div className="usage-progress-bar-small" style={{ width: `${albumUploadProgress}%`, backgroundColor: '#38d13b' }}></div>
              </div>
              <span className="upload-pct">Uploading {albumUploadProgress}%</span>
            </div>
          )}
          {!albumUploading && (
            <div className="pulsify-replace-track">
              <div className="replace-icon">💿</div>
              <span className="replace-name">{albumFiles.length} tracks selected</span>
              <button onClick={handleAlbumReset} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '12px' }}>Start over</button>
            </div>
          )}
          <Link to="/" className="pulsify-upload-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.94 7.05 5.99 5.99 7.05 10.94 12l-4.95 4.95 1.06 1.06L12 13.06l4.95 4.95 1.06-1.06L13.06 12l4.95-4.95-1.06-1.06L12 10.94Z" /></svg>
          </Link>
        </div>

        <div className="pulsify-upload-body" style={{ padding: '0' }}>
          {/* Top section: Artwork + Form side by side */}
          <div style={{ display: 'flex', gap: '40px', padding: '30px 40px 0' }}>
            {/* Artwork */}
            <div style={{ flexShrink: 0 }}>
              <div className="artwork-preview" onClick={() => albumArtworkInputRef.current?.click()} style={{ width: '260px', height: '260px', border: '2px dashed #333', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#1a1a1a', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#555'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#333'}
              >
                {albumArtworkPreview ? (
                  <img src={albumArtworkPreview} alt="Album artwork" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                ) : (
                  <>
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span style={{ color: '#888', fontSize: '13px', marginTop: '12px' }}>Add new artwork</span>
                  </>
                )}
                <input ref={albumArtworkInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAlbumArtworkSelect} style={{ display: 'none' }} />
              </div>
            </div>

            {/* Form fields */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Album title */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Album title <span style={{ color: '#e22134' }}>*</span></label>
                <input type="text" required maxLength={100} value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} placeholder="" style={{ width: '100%', padding: '8px 0', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #444', color: '#fff', fontSize: '14px', outline: 'none' }} />
              </div>

              {/* Album link */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Album link</label>
                <input type="text" disabled value={`https://pulsify.page/${albumTitle ? albumTitle.toLowerCase().replace(/\\s+/g, '-') : 'your-album'}/sets/`} style={{ width: '100%', padding: '8px 0', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#666', fontSize: '13px', outline: 'none', cursor: 'default' }} />
              </div>

              {/* Main Artist(s) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  Main Artist(s)
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #666', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#666', cursor: 'help' }} title="Put your name and any featured artists you want to give primary credit to here.">?</span>
                </label>
                <input type="text" defaultValue="" placeholder="" style={{ width: '100%', padding: '8px 0', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #444', color: '#fff', fontSize: '13px', outline: 'none' }} />
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Tip: Use commas to add multiple artist names.</div>
              </div>

              {/* Genre + Album Type side by side */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Genre</label>
                  <select required value={albumGenre} onChange={(e) => setAlbumGenre(e.target.value)} style={{ width: '100%', padding: '8px 10px', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #444', color: '#ccc', fontSize: '13px', outline: 'none', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'%23888\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center' }}>
                    <option value="" disabled>Add or search for genre</option>
                    {PulsifyTrackService.GENRE_OPTIONS.map(g => (<option key={g} value={g}>{g}</option>))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Album Type</label>
                  <select value={albumType} onChange={(e) => setAlbumType(e.target.value)} style={{ width: '100%', padding: '8px 10px', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #444', color: '#ccc', fontSize: '13px', outline: 'none', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'%23888\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center' }}>
                    <option>Album</option><option>EP</option><option>Single</option><option>Compilation</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  Tags
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #666', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#666', cursor: 'help' }} title="Tags help identify what kind of sound your track is.">?</span>
                </label>
                <input type="text" placeholder="Add styles, moods, tempo." style={{ width: '100%', padding: '8px 0', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #444', color: '#ccc', fontSize: '13px', outline: 'none' }} />
              </div>

              {/* Album Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Album Description</label>
                <textarea rows={1} maxLength={200} value={albumDescription} onChange={(e) => setAlbumDescription(e.target.value)} placeholder="Tracks with descriptions tend to get more plays and engagements." style={{ width: '100%', padding: '8px 0', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #444', color: '#ccc', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
              </div>

              {/* Album Privacy */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>Album Privacy</label>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#ccc' }}>
                    <input type="radio" name="album-privacy" checked={albumVisibility === 'public'} onChange={() => setAlbumVisibility('public')} style={{ accentColor: '#f50' }} />
                    Public
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#ccc' }}>
                    <input type="radio" name="album-privacy" checked={albumVisibility === 'private'} onChange={() => setAlbumVisibility('private')} style={{ accentColor: '#f50' }} />
                    Private
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ── Full-width Tracks Section ── */}
          <div style={{ padding: '30px 40px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Tracks</h3>

            {/* Recommend banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#1a1a1a', borderRadius: '6px', padding: '16px 20px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #5b21b6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '14px', marginBottom: '4px' }}>Recommend tracks to new listeners</div>
                <div style={{ color: '#888', fontSize: '12px', lineHeight: '1.4' }}>
                  Sorry, these tracks cannot be recommended because either the tracks are private, you've exceeded your daily limit or the track length does not meet the criteria. <a href="#" style={{ color: '#888', textDecoration: 'underline' }}>See how it works.</a>
                </div>
              </div>
            </div>

            {/* Track rows */}
            {albumFiles.map((file, idx) => {
              const trackName = file.name.replace(/\.[^/.]+$/, '');
              return (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center',
                  borderBottom: '1px solid #2a2a2a',
                  padding: '12px 0',
                }}>
                  {/* Drag handle */}
                  <div style={{ cursor: 'grab', padding: '0 10px 0 0', color: '#555', flexShrink: 0 }}>
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
                      <circle cx="2" cy="2" r="1.2" /><circle cx="6" cy="2" r="1.2" />
                      <circle cx="2" cy="7" r="1.2" /><circle cx="6" cy="7" r="1.2" />
                      <circle cx="2" cy="12" r="1.2" /><circle cx="6" cy="12" r="1.2" />
                    </svg>
                  </div>

                  {/* Play button — dark circle */}
                  <button style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#333', border: 'none', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0, marginRight: '12px',
                    transition: 'background-color 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f50'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#333'}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </button>

                  {/* Track number */}
                  <span style={{ color: '#888', fontSize: '14px', fontWeight: 500, minWidth: '24px', marginRight: '14px', textAlign: 'center' }}>{idx + 1}</span>

                  {/* Editable title input */}
                  <input
                    type="text"
                    defaultValue={trackName}
                    style={{
                      flex: 1, maxWidth: '420px',
                      background: '#1a1a1a', border: '1px solid #333',
                      borderRadius: '3px', color: '#fff', padding: '8px 12px',
                      fontSize: '14px', outline: 'none', minWidth: 0,
                      transition: 'border-color 0.15s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#f50'}
                    onBlur={e => e.currentTarget.style.borderColor = '#333'}
                  />

                  {/* Original filename */}
                  <span style={{ color: '#666', fontSize: '12px', marginLeft: '16px', flexShrink: 0, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>

                  {/* Spacer */}
                  <div style={{ flex: '0 0 1', marginLeft: 'auto' }} />

                  {/* Duration */}
                  <span style={{ color: '#1db954', fontSize: '13px', fontWeight: 600, marginLeft: '16px', flexShrink: 0, minWidth: '36px', fontFamily: 'monospace' }}>
                    0:00
                  </span>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', flexShrink: 0 }}>
                    {/* Spotlight/Pin */}
                    <button style={{ background: 'none', border: '1px solid #444', borderRadius: '50%', width: '32px', height: '32px', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#888'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#888'; }}
                      title="Spotlight"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
                    </button>
                    {/* Edit */}
                    <button style={{ background: 'none', border: '1px solid #444', borderRadius: '50%', width: '32px', height: '32px', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#888'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#888'; }}
                      title="Edit"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    {/* Delete */}
                    <button style={{ background: 'none', border: '1px solid #444', borderRadius: '50%', width: '32px', height: '32px', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#e22134'; e.currentTarget.style.color = '#e22134'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#888'; }}
                      title="Remove"
                      onClick={() => setAlbumFiles(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add tracks link */}
            <button style={{ background: 'none', border: 'none', color: '#666', fontSize: '13px', padding: '12px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = '#666'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Add tracks
            </button>
          </div>
        </div>

        <div className="pulsify-upload-footer">
          <div className="footer-terms">
            By uploading, you confirm that your sounds comply with our <a href="/terms">Terms of Use</a> and you don't infringe anyone else's rights.
          </div>
          <button
            className="upload-submit-btn"
            disabled={albumUploading}
            onClick={handleAlbumSubmit}
          >
            {albumUploading ? `Uploading ${albumUploadProgress}%...` : 'Upload Album'}
          </button>
        </div>
      </div>
    );
  }

  if (transcodingStatus === 'finished' && uploadedTrack) {
    return (
      <div className="pulsify-upload-page">
        <div className="pulsify-upload-header">
          <h1>
            <span
              style={{
                color: "#7c3aed",
                fontWeight: 800,
                fontSize: "18px",
                letterSpacing: "-0.5px",
              }}
            >
              Pulsify
            </span>
            Upload
          </h1>
          <Link to="/" className="pulsify-upload-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 10.94 7.05 5.99 5.99 7.05 10.94 12l-4.95 4.95 1.06 1.06L12 13.06l4.95 4.95 1.06-1.06L13.06 12l4.95-4.95-1.06-1.06L12 10.94Z" />
            </svg>
          </Link>
        </div>
        <div className="pulsify-upload-body pulsify-success-screen-modern">
          <div className="success-timeline-container">
            <div className="success-timeline">
              <div className="timeline-line"></div>

              {/* Step 1: Saved (Solid) */}
              <div className="timeline-step">
                <div className="timeline-circle circle-solid">
                  <svg
                    height="58"
                    width="58"
                    viewBox="0 0 143 64"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      transform="translate(-166.000000, -1125.000000)"
                      d="M308.984235,1169.99251 C308.382505,1180.70295 299.444837,1189.03525 288.718543,1188.88554 L240.008437,1188.88554 C237.777524,1188.86472 235.977065,1187.05577 235.966737,1184.82478 L235.966737,1132.37801 C235.894282,1130.53582 236.962478,1128.83883 238.654849,1128.10753 C238.654849,1128.10753 243.135035,1124.99996 252.572022,1124.99996 C258.337036,1124.99309 263.996267,1126.54789 268.948531,1129.49925 C276.76341,1134.09703 282.29495,1141.75821 284.200228,1150.62285 C285.880958,1150.14737 287.620063,1149.90993 289.36674,1149.91746 C294.659738,1149.88414 299.738952,1152.0036 303.438351,1155.78928 C307.13775,1159.57496 309.139562,1164.70168 308.984235,1169.99251 Z M229.885123,1135.69525 C231.353099,1153.48254 232.420718,1169.70654 229.885123,1187.43663 C229.796699,1188.23857 229.119091,1188.84557 228.312292,1188.84557 C227.505494,1188.84557 226.827885,1188.23857 226.739461,1187.43663 C224.375448,1169.85905 225.404938,1153.33003 226.739461,1135.69525 C226.672943,1135.09199 226.957336,1134.50383 227.471487,1134.18133 C227.985639,1133.85884 228.638946,1133.85884 229.153097,1134.18133 C229.667248,1134.50383 229.951641,1135.09199 229.885123,1135.69525 Z M220.028715,1187.4557 C219.904865,1188.26549 219.208361,1188.86356 218.389157,1188.86356 C217.569953,1188.86356 216.87345,1188.26549 216.7496,1187.4557 C214.986145,1172.28686 214.986145,1156.96477 216.7496,1141.79593 C216.840309,1140.9535 217.551388,1140.31488 218.398689,1140.31488 C219.245991,1140.31488 219.95707,1140.9535 220.047779,1141.79593 C222.005153,1156.95333 221.998746,1172.29994 220.028715,1187.4557 Z M210.153241,1140.2517 C211.754669,1156.55195 212.479125,1171.15545 210.134176,1187.41757 C210.134176,1188.29148 209.425728,1188.99993 208.551813,1188.99993 C207.677898,1188.99993 206.969449,1188.29148 206.969449,1187.41757 C204.70076,1171.36516 205.463344,1156.34224 206.969449,1140.2517 C207.05845,1139.43964 207.744425,1138.82474 208.561345,1138.82474 C209.378266,1138.82474 210.06424,1139.43964 210.153241,1140.2517 Z M200.258703,1187.47476 C200.169129,1188.29694 199.474788,1188.91975 198.647742,1188.91975 C197.820697,1188.91975 197.126356,1188.29694 197.036782,1187.47476 C195.216051,1173.32359 195.216051,1158.99744 197.036782,1144.84627 C197.036782,1143.94077 197.770837,1143.20671 198.676339,1143.20671 C199.581842,1143.20671 200.315897,1143.94077 200.315897,1144.84627 C202.251054,1158.99121 202.231809,1173.33507 200.258703,1187.47476 Z M190.383229,1155.50339 C192.880695,1166.56087 191.755882,1176.32196 190.287906,1187.58915 C190.168936,1188.33924 189.522207,1188.89148 188.762737,1188.89148 C188.003266,1188.89148 187.356537,1188.33924 187.237567,1187.58915 C185.903044,1176.47448 184.797296,1166.48462 187.142244,1155.50339 C187.142244,1154.60842 187.867763,1153.8829 188.762737,1153.8829 C189.65771,1153.8829 190.383229,1154.60842 190.383229,1155.50339 Z M180.526821,1153.82571 C182.814575,1165.15009 182.071055,1174.7396 180.469627,1186.10211 C180.27898,1187.7798 177.400223,1187.79886 177.247706,1186.10211 C175.798795,1174.91118 175.112468,1165.0357 177.190512,1153.82571 C177.281785,1152.97315 178.001234,1152.32661 178.858666,1152.32661 C179.716099,1152.32661 180.435548,1152.97315 180.526821,1153.82571 Z M170.575089,1159.31632 C172.977231,1166.82778 172.157452,1172.92846 170.479765,1180.63056 C170.391921,1181.42239 169.722678,1182.02149 168.925999,1182.02149 C168.12932,1182.02149 167.460077,1181.42239 167.372232,1180.63056 C165.923321,1173.08097 165.332318,1166.84684 167.23878,1159.31632 C167.330053,1158.46376 168.049502,1157.81722 168.906934,1157.81722 C169.764367,1157.81722 170.483816,1158.46376 170.575089,1159.31632 Z"
                    ></path>
                  </svg>
                </div>
                <div className="timeline-content">
                  <h2 className="success-title-main">Saved to Pulsify.</h2>
                  <p className="success-subtitle-main">
                    Congratulations! Your tracks are now on Pulsify.
                  </p>
                  <button
                    onClick={() => navigate(`/tracks/${uploadedTrack._id}`)}
                    className="success-btn-outline"
                  >
                    View track
                  </button>
                </div>
              </div>

              {/* Step 2: Distribute (Dashed 1 - Spotify) */}
              <div className="timeline-step distribute-step">
                <div className="timeline-circle circle-dashed">
                  <svg
                    height="58"
                    width="58"
                    viewBox="0 0 60 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M30 3.75C15.503 3.75 3.75 15.502 3.75 30S15.503 56.25 30 56.25 56.25 44.498 56.25 30 44.497 3.75 30 3.75Zm12.807 37.841a2.29 2.29 0 0 1-3.11.876 27.183 27.183 0 0 0-10.624-3.345 27.325 27.325 0 0 0-11.104 1.15 2.281 2.281 0 1 1-1.388-4.348 31.782 31.782 0 0 1 12.954-1.343 31.771 31.771 0 0 1 12.393 3.904 2.279 2.279 0 0 1 .879 3.106Zm3.142-7.973a2.28 2.28 0 0 1-3.078.97 35.682 35.682 0 0 0-12.943-3.861 35.57 35.57 0 0 0-13.542 1.206 2.282 2.282 0 0 1-1.265-4.387 40.217 40.217 0 0 1 15.269-1.362 40.257 40.257 0 0 1 14.592 4.356 2.282 2.282 0 0 1 .967 3.078Zm1.137-6.634a2.3 2.3 0 0 1-1.018-.239 44.107 44.107 0 0 0-15.288-4.413 44.014 44.014 0 0 0-15.894 1.257 2.283 2.283 0 0 1-1.173-4.412 48.654 48.654 0 0 1 17.532-1.386 48.599 48.599 0 0 1 16.86 4.867 2.284 2.284 0 0 1-1.019 4.326Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
                <div className="timeline-content distribute-content">
                  <h3 className="distribute-title">
                    Distribute to more streaming services?
                  </h3>
                  <p className="distribute-subtitle">
                    Easily send your Pulsify tracks to Spotify, Apple Music,
                    TikTok, Instagram and more with a Artist Pro subscription.{" "}
                    <a href="#" className="learn-more-link">
                      Learn more.
                    </a>
                  </p>
                  <button className="success-btn-white">
                    Unlock with Artist Pro
                  </button>
                </div>
              </div>

              {/* Step 3: Apple Music (Dashed 2) */}
              <div className="timeline-step empty-step">
                <div className="timeline-circle circle-dashed">
                  <svg
                    height="58"
                    width="58"
                    viewBox="0 0 60 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M56.25 18.29v1.882l-.022 19.653c0 .209 0 .418.002.627.001.418.003.836-.002 1.254 0 .525-.007 1.057-.022 1.582-.036 1.153-.102 2.312-.306 3.45a11.566 11.566 0 0 1-1.08 3.281 10.959 10.959 0 0 1-2.026 2.793A11.088 11.088 0 0 1 50 54.84a11.518 11.518 0 0 1-3.274 1.08c-1.137.204-2.297.277-3.449.306a57.18 57.18 0 0 1-1.582.022H20.164l-.628.001c-.418.002-.836.004-1.254-.001a57.18 57.18 0 0 1-1.582-.022c-1.152-.037-2.311-.102-3.449-.306a11.595 11.595 0 0 1-3.274-1.08 11.089 11.089 0 0 1-2.793-2.027 11.086 11.086 0 0 1-2.027-2.793 11.64 11.64 0 0 1-1.079-3.281c-.204-1.138-.277-2.297-.306-3.45a57.232 57.232 0 0 1-.022-1.582V18.291l.022-1.575c.036-1.153.102-2.312.306-3.45.204-1.16.547-2.231 1.08-3.281a10.985 10.985 0 0 1 2.034-2.793 10.957 10.957 0 0 1 2.792-2.027c1.043-.54 2.122-.875 3.274-1.087 1.138-.204 2.297-.277 3.45-.306a57.22 57.22 0 0 1 1.582-.022H41.71l1.59.022c1.152.036 2.312.102 3.449.306 1.152.204 2.224.547 3.274 1.08a11.085 11.085 0 0 1 2.793 2.027 11.086 11.086 0 0 1 2.027 2.793c.532 1.05.875 2.129 1.079 3.281.204 1.138.277 2.297.306 3.45.015.524.022 1.057.022 1.582Zm-16.778-6.278a55.87 55.87 0 0 1 1.393-.241c.845-.073 1.32.481 1.327 1.378v24.755c0 .664-.008 1.269-.146 1.933a4.932 4.932 0 0 1-.766 1.8c-.379.547-.867.992-1.436 1.328-.576.342-1.181.532-1.823.663-1.21.248-2.035.3-2.815.146a3.95 3.95 0 0 1-1.896-.962 4.085 4.085 0 0 1-1.327-2.596 4.114 4.114 0 0 1 1.116-3.267c.438-.452.977-.81 1.706-1.094.758-.291 1.597-.466 2.888-.729.171-.033.34-.067.51-.102.17-.035.34-.07.51-.102.445-.095.832-.204 1.138-.583.306-.38.314-.839.314-1.298V21.476c0-.882-.394-1.123-1.24-.962-.605.116-13.577 2.734-13.577 2.734-.736.182-.992.423-.992 1.327v16.931c0 .664-.036 1.27-.175 1.933a4.932 4.932 0 0 1-.765 1.8c-.38.548-.868.992-1.437 1.328a5.91 5.91 0 0 1-1.823.67c-1.21.248-2.034.3-2.814.146a3.897 3.897 0 0 1-1.896-.97 4.048 4.048 0 0 1-1.298-2.595c-.124-1.145.226-2.37 1.086-3.267.438-.452.978-.81 1.707-1.094.758-.291 1.597-.466 2.887-.729.172-.033.341-.067.51-.102.17-.034.34-.07.511-.102.445-.095.831-.204 1.137-.583.307-.38.343-.817.343-1.276V17.138c0-.263.022-.438.037-.525.065-.409.226-.766.525-1.014.24-.204.561-.35.97-.437h.007l15.604-3.15Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
                <div className="timeline-content"></div>
              </div>

              {/* Step 4: YouTube (Dashed 3) */}
              <div className="timeline-step empty-step">
                <div className="timeline-circle circle-dashed">
                  <svg
                    height="58"
                    width="58"
                    viewBox="0 0 60 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M51.974 11.488a7.046 7.046 0 0 1 4.975 4.973C58.126 20.848 58.126 30 58.126 30s0 9.152-1.177 13.539a7.046 7.046 0 0 1-4.975 4.973c-4.389 1.175-21.988 1.175-21.988 1.175s-17.598 0-21.987-1.175a7.046 7.046 0 0 1-4.975-4.973c-1.176-4.387-1.176-13.54-1.176-13.54s0-9.151 1.176-13.538a7.046 7.046 0 0 1 4.975-4.973c4.389-1.175 21.987-1.175 21.987-1.175s17.6 0 21.988 1.175ZM38.98 30l-14.621 8.438V21.561L38.979 30Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
                <div className="timeline-content"></div>
              </div>

              {/* Step 5: Instagram (Dashed 4) */}
              <div className="timeline-step empty-step">
                <div className="timeline-circle circle-dashed">
                  <svg
                    height="58"
                    width="58"
                    viewBox="0 0 60 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M12.81 5.127c-1.73.672-3.191 1.569-4.653 3.03-1.462 1.452-2.358 2.925-3.03 4.644-.651 1.665-1.089 3.575-1.217 6.371-.128 2.797-.16 3.693-.16 10.823 0 7.13.032 8.026.16 10.822.128 2.796.576 4.707 1.217 6.372.672 1.729 1.568 3.19 3.03 4.653 1.462 1.462 2.924 2.359 4.652 3.031 1.665.651 3.575 1.089 6.37 1.217 2.797.128 3.693.16 10.821.16s8.024-.032 10.82-.16c2.796-.128 4.706-.576 6.37-1.217 1.73-.672 3.191-1.569 4.653-3.03 1.462-1.463 2.358-2.925 3.03-4.654.651-1.665 1.089-3.576 1.217-6.372.128-2.796.16-3.693.16-10.822 0-7.13-.032-8.026-.16-10.823-.128-2.796-.576-4.706-1.217-6.371-.672-1.719-1.568-3.192-3.02-4.643-1.461-1.462-2.923-2.359-4.652-3.031-1.664-.651-3.575-1.089-6.37-1.217-2.796-.128-3.692-.16-10.82-.16s-8.025.032-10.82.16c-2.807.117-4.717.566-6.381 1.217Zm27.797 3.5c2.56.118 3.948.545 4.876.908 1.227.48 2.102 1.046 3.02 1.963.918.918 1.483 1.794 1.964 3.021.362.928.79 2.316.907 4.877.127 2.765.149 3.597.149 10.61 0 7.011-.032 7.844-.15 10.608-.117 2.562-.544 3.95-.906 4.878-.48 1.227-1.046 2.102-1.964 3.02-.918.918-1.793 1.484-3.02 1.964-.928.363-2.315.79-4.876.907-2.764.128-3.596.15-10.607.15-7.01 0-7.843-.032-10.607-.15-2.56-.117-3.948-.544-4.876-.907-1.227-.48-2.102-1.046-3.02-1.964-.918-.918-1.483-1.793-1.963-3.02-.363-.929-.79-2.316-.907-4.878-.129-2.764-.15-3.597-.15-10.609 0-7.012.032-7.844.15-10.608.117-2.562.544-3.95.907-4.878.48-1.227 1.045-2.103 1.963-3.02.918-.918 1.793-1.484 3.02-1.964.928-.363 2.315-.79 4.876-.907 2.764-.129 3.596-.15 10.607-.15 7.01 0 7.843.021 10.607.15Z"
                      fill="currentColor"
                    ></path>
                    <path
                      d="M16.523 30.005c0 7.45 6.04 13.48 13.477 13.48 7.438 0 13.477-6.04 13.477-13.48 0-7.439-6.029-13.48-13.477-13.48s-13.477 6.03-13.477 13.48Zm22.227 0A8.75 8.75 0 0 1 30 38.757a8.75 8.75 0 0 1-8.75-8.752A8.75 8.75 0 0 1 30 21.254a8.75 8.75 0 0 1 8.75 8.751Zm5.271-10.865a3.148 3.148 0 1 0 0-6.296 3.148 3.148 0 0 0 0 6.296Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
                <div className="timeline-content"></div>
              </div>

              {/* Steps 6-12: Remaining icons */}
              {/* Step 6 */}
              <div className="timeline-step empty-step">
                <div className="timeline-circle circle-dashed">
                  <svg
                    height="58"
                    width="58"
                    viewBox="0 0 60 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M41.934 22.701a20.62 20.62 0 0 0 12.028 3.847v-8.626c-.85 0-1.696-.089-2.526-.265v6.79a20.624 20.624 0 0 1-12.028-3.846v17.604c0 8.806-7.142 15.945-15.953 15.945-3.287 0-6.343-.994-8.88-2.697A15.909 15.909 0 0 0 25.98 56.25c8.811 0 15.954-7.139 15.954-15.946V22.701Zm3.116-8.703a12.02 12.02 0 0 1-3.116-7.039V5.85H39.54A12.077 12.077 0 0 0 45.05 14ZM20.147 44.695a7.296 7.296 0 0 1 5.809-11.709c.75 0 1.497.115 2.213.342v-8.82a16.09 16.09 0 0 0-2.524-.145v6.865a7.303 7.303 0 0 0-2.215-.342 7.295 7.295 0 0 0-7.298 7.293 7.292 7.292 0 0 0 4.015 6.516Z"
                      fill="currentColor"
                      opacity="0.2"
                    ></path>
                    <path
                      d="M39.408 20.6a20.624 20.624 0 0 0 12.028 3.848v-6.79a12.074 12.074 0 0 1-6.386-3.66 12.077 12.077 0 0 1-5.51-8.148h-6.287v34.454a7.296 7.296 0 0 1-7.298 7.27 7.288 7.288 0 0 1-5.809-2.88 7.293 7.293 0 0 1 3.283-13.808c.773 0 1.517.12 2.215.342v-6.865c-8.655.18-15.617 7.248-15.617 15.941 0 4.34 1.734 8.274 4.547 11.149a15.883 15.883 0 0 0 8.881 2.697c8.81 0 15.953-7.14 15.953-15.945V20.6Z"
                      fill="currentColor"
                    ></path>
                    <path
                      d="M51.434 17.658v-1.836a12.03 12.03 0 0 1-6.386-1.824 12.064 12.064 0 0 0 6.386 3.66ZM39.54 5.85a12.324 12.324 0 0 1-.133-.99V3.75h-8.681v34.455a7.296 7.296 0 0 1-7.297 7.269 7.27 7.27 0 0 1-3.284-.778 7.289 7.289 0 0 0 5.81 2.877 7.296 7.296 0 0 0 7.297-7.268V5.85h6.288ZM25.643 24.364v-1.955c-.726-.099-1.457-.149-2.19-.148-8.81 0-15.953 7.138-15.953 15.944 0 5.52 2.807 10.386 7.073 13.248a15.886 15.886 0 0 1-4.547-11.149c0-8.693 6.96-15.762 15.617-15.94Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
              </div>

              {/* Step 7 */}
              <div className="timeline-step empty-step">
                <div className="timeline-circle circle-dashed">
                  <svg
                    height="58"
                    width="58"
                    viewBox="0 0 60 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M56.25 13.125H44.898v6.642H56.25v-6.642Zm0 9.211H44.898v6.642H56.25v-6.642Zm0 9.207H44.898v6.642H56.25v-6.642Zm-41.148 9.206H3.75v6.642h11.352v-6.642Zm13.707 0H17.457v6.642h11.352v-6.642Zm13.734 0H31.191v6.642h11.352v-6.642Zm13.707 0H44.898v6.642H56.25v-6.642Zm-13.707-9.206H31.191v6.642h11.352v-6.642Zm-13.734 0H17.457v6.642h11.352v-6.642Zm0-9.207H17.457v6.642h11.352v-6.642Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
              </div>

              {/* Step 8 */}
              <div className="timeline-step empty-step">
                <div className="timeline-circle circle-dashed">
                  <svg
                    height="58"
                    width="58"
                    viewBox="0 0 60 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="m22.81 13.902 6.442 30.695h1.497l6.44-30.695H48.75v32.196h-5.845V19.24l1.088-3.838h-1.886l-6.712 30.695H24.65l-6.759-30.695h-1.839l1.042 3.838v26.857H11.25V13.902h11.56Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
              </div>

              {/* Step 9 */}
              <div className="timeline-step empty-step">
                <div className="timeline-circle circle-dashed">
                  <svg
                    height="58"
                    width="58"
                    viewBox="0 0 60 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M34.064 56.25V32.302h8.038l1.204-9.333h-9.242v-5.958c0-2.702.75-4.544 4.625-4.544l4.942-.002V4.118c-.855-.114-3.788-.368-7.202-.368-7.125 0-12.003 4.35-12.003 12.337v6.882h-8.059v9.333h8.059V56.25h9.638Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
              </div>

              {/* Step 10 */}
              <div className="timeline-step empty-step">
                <div className="timeline-circle circle-dashed">
                  <svg
                    height="58"
                    width="58"
                    viewBox="0 0 60 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M36.668 60c-9.642 0-17.337-7.597-17.337-17.435a17.45 17.45 0 0 1 4.53-11.785L12.076 42.565 5.89 36.38l13.297-13.15c1.8-1.8 2.725-4.14 2.725-6.72V0h8.718v16.51c0 5.065-1.8 9.35-5.308 12.857l-.39.39a17.36 17.36 0 0 1 11.735-4.53c9.888 0 17.438 7.84 17.438 17.338A17.357 17.357 0 0 1 36.668 60m0-26.785c-5.307 0-9.447 4.382-9.447 9.35 0 5.113 4.187 9.45 9.45 9.45a9.51 9.51 0 0 0 9.545-9.45c0-5.162-4.288-9.35-9.548-9.35"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
              </div>

              {/* Step 11 */}
              <div className="timeline-step empty-step">
                <div className="timeline-circle circle-dashed">
                  <svg
                    height="58"
                    width="58"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <g stroke="currentColor" fill="none">
                      <circle cx="24" cy="24" r="21.5"></circle>
                      <path d="M32.2807,29.7009c1.112-.451,3.0916-1.0492,3.6872-.3272.6446.7814-.17,2.4769-.92,3.7942"></path>
                      <path d="M11.7984,30.2234c1.7586,1.3965,6.9532,3.5343,12.4876,3.5343a17.0029,17.0029,0,0,0,10.1671-3.0789"></path>
                      <path d="M20.4043,20.125v3.3a2,2,0,0,0,2,2h0a2,2,0,0,0,2-2v-3.3"></path>
                      <line
                        x1="24.4043"
                        y1="23.425"
                        x2="24.4043"
                        y2="25.425"
                      ></line>
                      <path d="M10.4,22.225a2,2,0,0,1,2-2h0a2,2,0,0,1,2,2v3.2"></path>
                      <line
                        x1="10.4001"
                        y1="20.225"
                        x2="10.4001"
                        y2="25.425"
                      ></line>
                      <path d="M14.4,22.225a2,2,0,0,1,2-2h0a2,2,0,0,1,2,2v3.2"></path>
                      <circle cx="31.88" cy="17.675" r="0.7"></circle>
                      <line
                        x1="31.88"
                        y1="20.125"
                        x2="31.88"
                        y2="25.425"
                      ></line>
                      <path d="M26.5407,24.9733a2.249,2.249,0,0,0,1.6448.4472h.4487a1.3236,1.3236,0,0,0,1.3222-1.325h0a1.3236,1.3236,0,0,0-1.3222-1.325h-.8974a1.3235,1.3235,0,0,1-1.3221-1.325h0a1.3235,1.3235,0,0,1,1.3221-1.325h.4487a2.2494,2.2494,0,0,1,1.6449.4472"></path>
                      <path d="M37.6,24.4176a1.9991,1.9991,0,0,1-1.7366,1.0074h0a2,2,0,0,1-2-2v-1.3a2,2,0,0,1,2-2h0a1.9989,1.9989,0,0,1,1.7346,1.0039"></path>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Step 12 */}
              <div className="timeline-step empty-step">
                <div className="timeline-circle circle-dashed">
                  <svg
                    width="58"
                    height="58"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 3.75V12M12 12V20.25M12 12H3.75M12 12H20.25"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pulsify-upload-page">
      <div className="pulsify-upload-header">
        <h1>
          <span
            style={{
              color: "#7c3aed",
              fontWeight: 800,
              fontSize: "18px",
              letterSpacing: "-0.5px",
            }}
          >
            Pulsify
          </span>
          {selectedFile ? "Track info" : "Upload"}
        </h1>
        {/* Usage indicator */}
        {!isPro && trackLimit && !selectedFile && (
          <div
            style={{
              fontSize: "12px",
              color: "#888",
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>
              {trackUsed}/{trackLimit} tracks
            </span>
            <div
              style={{
                width: "60px",
                height: "4px",
                backgroundColor: "#333",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(trackUsed / trackLimit) * 100}%`,
                  height: "100%",
                  backgroundColor: trackRemaining <= 2 ? "#f50" : "#4caf50",
                  borderRadius: "2px",
                }}
              />
            </div>
          </div>
        )}
        {isPro && !selectedFile && (
          <div style={{ fontSize: '11px', color: '#c9a96e', marginLeft: 'auto', marginRight: '40px', fontWeight: 700, letterSpacing: '0.5px' }}>
            ★ PRO — Unlimited
          </div>
        )}
        {selectedFile &&
          (isUploading ? (
            <div className="pulsify-header-upload-progress">
              <span className="replace-name">{selectedFile.name}</span>
              <div className="usage-progress-small">
                <div
                  className="usage-progress-bar-small"
                  style={{
                    width: `${uploadProgress}%`,
                    backgroundColor: "#38d13b",
                  }}
                ></div>
              </div>
              <span className="upload-pct">Uploading {uploadProgress}%</span>
              <button className="pulsify-upload-close-small">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ display: "block" }}
                >
                  <path d="M12 10.94 7.05 5.99 5.99 7.05 10.94 12l-4.95 4.95 1.06 1.06L12 13.06l4.95 4.95 1.06-1.06L13.06 12l4.95-4.95-1.06-1.06L12 10.94Z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="pulsify-replace-track">
              <div className="replace-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="replace-name">{selectedFile.name}</span>
              <button
                onClick={handleReplaceTrack}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ccc",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Replace track
              </button>
            </div>
          ))}
        <Link to="/" className="pulsify-upload-close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
            <path d="M12 10.94 7.05 5.99 5.99 7.05 10.94 12l-4.95 4.95 1.06 1.06L12 13.06l4.95 4.95 1.06-1.06L13.06 12l4.95-4.95-1.06-1.06L12 10.94Z" />
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
                    <path d="M9 19.5H6.75a5.25 5.25 0 1 1 1.3-10.34" />
                    <path d="M7.5 12A7.5 7.5 0 1 1 21 16.5" />
                    <path d="M11.07 15.18 14.25 12l3.18 3.18m-3.18 4.32V12" />
                  </g>
                </svg>
                <div className="usage-text-stack">
                  <span className="usage-title">
                    {isPro
                      ? "★ Unlimited uploads"
                      : trackLimit && trackUsed > trackLimit
                        ? `⚠ Over limit! ${trackUsed} tracks (max ${trackLimit})`
                        : `${trackLimit ? Math.min(Math.round((trackUsed / trackLimit) * 100), 100) : 0}% of uploads used`}
                  </span>
                </div>
              </div>
              <div className="usage-center">
                <div className="usage-progress">
                  <div
                    className="usage-progress-bar"
                    style={{
                      width: isPro
                        ? "100%"
                        : `${trackLimit ? Math.min(Math.max((trackUsed / trackLimit) * 100, 0.5), 100) : 0.5}%`,
                      backgroundColor: isPro
                        ? "#c9a96e"
                        : trackLimit && trackUsed > trackLimit
                          ? "#f50"
                          : undefined,
                    }}
                  ></div>
                </div>
                <span className="usage-minutes">
                  {isPro
                    ? "Artist Pro — No limits"
                    : `${trackUsed} of ${trackLimit} tracks`}
                </span>
              </div>
              {!isPro && (
                <Link to="/premium" className="usage-cta">
                  Get unlimited uploads
                </Link>
              )}
              {isPro && (
                <span
                  className="usage-cta"
                  style={{
                    color: "#c9a96e",
                    cursor: "default",
                    border: "1px solid #c9a96e33",
                  }}
                >
                  ★ PRO
                </span>
              )}
            </div>

            <h2>Upload your audio files.</h2>
            <p className="format-note">
              For best quality, use WAV, FLAC, or AAC. The maximum file size is
              30MB.{" "}
              <a href="#" className="learn-more">
                Learn more.
              </a>
            </p>

            <div
              className={`pulsify-dropzone ${isDragActive ? "drag-active" : ""}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="drop-icon">
                <svg width="69" height="72" fill="none" viewBox="0 0 69 72">
                  <g clipPath="url(#dropIcon)">
                    <path d="M26.405 8.21c.06-.13.13-.26.2-.38.16-.31.33-.61.51-.9.08-.13.15-.25.23-.38.22-.33.44-.66.68-.97.04-.05.08-.11.12-.17.28-.36.57-.69.88-1.02.08-.09.17-.17.26-.26.23-.23.47-.46.71-.67.11-.09.21-.18.32-.27.27-.22.54-.42.82-.61.08-.06.16-.12.24-.17.26-.17.53-.32.81-.47.14-.08.26-.16.4-.23.41-.21.84-.4 1.27-.56l-13.92 5.19c-.43.16-.86.35-1.27.56-.14.07-.27.16-.4.23-.25.14-.5.27-.74.42-.02.02-.05.04-.07.05-.08.05-.16.11-.24.17-.28.19-.55.4-.82.61-.11.09-.21.18-.32.27-.24.21-.48.44-.71.67-.09.09-.18.17-.26.26-.3.32-.6.66-.88 1.02-.04.05-.08.11-.12.17a13.928 13.928 0 0 0-.91 1.34c-.18.29-.35.59-.51.9-.07.13-.14.25-.2.38-.21.43-.13.27-.31.73M56.155 51.7l-17.09-3.93-9.77-2.24c-5.7-1.31-10.64-6.41-13.08-12.75-1.02-2.66-1.6-5.55-1.61-8.46-.01-5.97 2.38-10.7 6.07-13.09.65-.42 1.34-.77 2.06-1.04l-13.92 5.19c-.72.27-1.41.62-2.06 1.04-3.69 2.39-6.08 7.12-6.06 13.09 0 2.91.58 5.8 1.61 8.46 2.43 6.34 7.38 11.44 13.08 12.75l9.77 2.24 17.09 3.93c1.94.45 3.77.32 5.4-.29l13.92-5.19c-1.63.61-3.46.74-5.4.29h-.01z" stroke="currentColor" strokeMiterlimit="10" />
                    <path d="M58.395 22.75c-1.12-10.48-8.3-20.01-16.99-22.01-6.98-1.6-12.96 2.11-15.61 8.8-6.44.4-11.21 6.36-11.19 14.78.02 9.86 6.59 19.35 14.68 21.21l9.77 2.24v-5.43l4.88 1.12v-5.43l4.88 1.12v5.43l-4.88-1.12v5.43l12.21 2.81c6.74 1.55 12.19-3.85 12.18-12.07-.01-7.25-4.29-14.28-9.94-16.88h.01zm-9.06 8.9-5.39-7.79v14.18l-4.88-1.12V22.74l-5.36 5.31-3.46-5 7.65-7.59c1.87-1.85 4.83-1.76 7.33 1.85l7.56 10.93-3.44 3.41h-.01zM4.895 42.95l12.13-4.52c-.77-1.14-1.46-2.36-2.05-3.65L2.845 39.3c.58 1.29 1.27 2.51 2.04 3.65h.01zM34.185 52.09l4.88 1.12v5.43l-4.88-1.12v-5.43zM39.065 66.43l3.45.79v3.84l-3.45-.79v-3.84z" fill="currentColor" />
                    <path d="M58.395 22.75c-1.11-10.48-8.3-20.01-16.99-22.01-6.98-1.6-12.96 2.11-15.61 8.8-6.44.4-11.21 6.36-11.19 14.78.02 9.86 6.59 19.35 14.68 21.21l9.77 2.24 4.88 1.12 12.22 2.81c6.74 1.55 12.19-3.85 12.18-12.07-.01-7.25-4.29-14.28-9.94-16.88z" stroke="currentColor" strokeMiterlimit="10" />
                  </g>
                  <defs>
                    <clipPath id="dropIcon">
                      <path fill="#fff" transform="translate(.315)" d="M0 0h68.4v71.06H0z" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <p className="drop-text">
                Drag and drop audio files to get started.
              </p>
              <span className="choose-btn">Choose files</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.flac,.aac,audio/mpeg,audio/wav,audio/flac,audio/aac"
                multiple
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
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <div className="mic-content">
                <div className="mic-title">Or record with a microphone</div>
                <div className="mic-desc">
                  Upload recorded voice memos, updates, news, or intros to new
                  releases.
                </div>
              </div>
              <svg className="mic-chevron" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="m10 3.94 7.53 7.53a.75.75 0 0 1 0 1.06L10 20.06 8.94 19l7-7-7-7L10 3.94Z" transform="rotate(90, 12, 12)" />
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
            {uploadError && (
              <div
                className="pulsify-upload-error"
                style={{ marginBottom: "24px" }}
              >
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
            By uploading, you confirm that your sounds comply with our{" "}
            <a href="/terms">Terms of Use</a> and you don't infringe anyone
            else's rights.
          </div>
          <button
            type="submit"
            form="pulsify-metadata-form"
            className="upload-submit-btn"
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}
    </div>
  );
};
