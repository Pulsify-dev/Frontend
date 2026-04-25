import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createTrack, getTrackStatus, TRACK_GENRES } from "../services/api";

const AUDIO_ACCEPT =
  ".mp3,.flac,.wav,.aac,audio/mpeg,audio/flac,audio/wav,audio/aac";
const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
const AUDIO_MAX_MB = 30;
const IMAGE_MAX_MB = 10;

const validateAudio = (file) => {
  if (!file) return "Audio file is required.";
  const validExts = [".mp3", ".flac", ".wav", ".aac"];
  const ext = "." + file.name.split(".").pop().toLowerCase();
  if (!validExts.includes(ext))
    return "Invalid audio format. Only MP3, FLAC, WAV, and AAC are allowed.";
  if (file.size > AUDIO_MAX_MB * 1024 * 1024)
    return `Audio file exceeds the ${AUDIO_MAX_MB} MB limit.`;
  return null;
};

const validateArtwork = (file) => {
  if (!file) return "Artwork file is required.";
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type))
    return "Invalid image format. Only JPEG, PNG, and WebP are allowed.";
  if (file.size > IMAGE_MAX_MB * 1024 * 1024)
    return `Artwork file exceeds the ${IMAGE_MAX_MB} MB limit.`;
  return null;
};

const pollTrackStatus = (trackId, onUpdate) =>
  new Promise((resolve, reject) => {
    let tries = 0;
    const interval = setInterval(async () => {
      tries++;
      try {
        const result = await getTrackStatus(trackId);
        onUpdate(result);
        if (result.status === "finished") {
          clearInterval(interval);
          resolve(result);
        } else if (result.status === "failed") {
          clearInterval(interval);
          reject(new Error(result.error_message || "Transcoding failed."));
        } else if (tries >= 60) {
          clearInterval(interval);
          reject(new Error("Upload timed out. Please try again."));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 4000);
  });

const STEPS = {
  SELECT: "select",
  METADATA: "metadata",
  UPLOADING: "uploading",
  DONE: "done",
};

export const PulsifyTrackUploadScreen = () => {
  const navigate = useNavigate();
  const audioInputRef = useRef(null);
  const [step, setStep] = useState(STEPS.SELECT);
  const [dragActive, setDragActive] = useState(false);

  const [audioFile, setAudioFile] = useState(null);
  const [artworkFile, setArtworkFile] = useState(null);
  const [artworkPreview, setArtworkPreview] = useState(null);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [previewStart, setPreviewStart] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [uploadError, setUploadError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [processingStatus, setProcessingStatus] = useState(null);
  const [createdTrackId, setCreatedTrackId] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const pickAudioFile = (file) => {
    const err = validateAudio(file);
    if (err) {
      setUploadError(err);
      return;
    }
    setUploadError("");
    setAudioFile(file);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    setStep(STEPS.METADATA);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) pickAudioFile(e.dataTransfer.files[0]);
  };

  const handleAudioChange = (e) => {
    if (e.target.files?.[0]) pickAudioFile(e.target.files[0]);
  };

  const handleArtworkChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateArtwork(file);
    if (err) {
      setFieldErrors((p) => ({ ...p, artwork: err }));
      return;
    }
    setFieldErrors((p) => ({ ...p, artwork: null }));
    setArtworkFile(file);
    setArtworkPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!title.trim()) errors.title = "Title is required.";
    if (!genre) errors.genre = "Genre is required.";
    const artErr = validateArtwork(artworkFile);
    if (artErr) errors.artwork = artErr;
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setStep(STEPS.UPLOADING);
    setUploadError("");
    setProcessingStatus({ status: "uploading" });

    try {
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const fields = {
        title: title.trim(),
        genre,
        description: description.trim() || undefined,
        lyrics: lyrics.trim() || undefined,
        preview_start_seconds:
          previewStart !== "" ? Number(previewStart) : undefined,
        tags: parsedTags,
        visibility: isPublic ? "public" : "private",
      };

      const created = await createTrack(fields, audioFile, artworkFile);
      const trackId = created._id ?? created.id;
      setCreatedTrackId(trackId);
      setProcessingStatus({ status: "processing", progress_percent: null });

      await pollTrackStatus(trackId, setProcessingStatus);
      setStep(STEPS.DONE);
    } catch (err) {
      setUploadError(err?.message || "Upload failed. Please try again.");
      setStep(STEPS.METADATA);
    }
  };

  const resetAll = () => {
    setStep(STEPS.SELECT);
    setAudioFile(null);
    setArtworkFile(null);
    setArtworkPreview(null);
    setTitle("");
    setGenre("");
    setDescription("");
    setTags("");
    setLyrics("");
    setPreviewStart("");
    setFieldErrors({});
    setCreatedTrackId(null);
    setProcessingStatus(null);
    setUploadError("");
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    backgroundColor: "#222",
    color: "white",
    border: "1px solid #444",
    borderRadius: "4px",
    boxSizing: "border-box",
    fontSize: "14px",
  };
  const labelStyle = {
    display: "block",
    marginBottom: "5px",
    color: "#ccc",
    fontSize: "14px",
  };
  const errorStyle = { color: "#f55", fontSize: "12px", marginTop: "4px" };

  // ── Step: Select ─────────────────────────────────────────────
  if (step === STEPS.SELECT) {
    return (
      <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
        <Link
          to="/playlists"
          style={{ color: "#f50", textDecoration: "none", fontSize: "14px" }}
        >
          ← Back to Sets
        </Link>
        <h1 style={{ marginTop: "16px" }}>Upload to Pulsify</h1>

        {uploadError && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "rgba(255,85,0,0.12)",
              border: "1px solid #f50",
              borderRadius: "6px",
              color: "#f50",
              marginBottom: "16px",
            }}
          >
            {uploadError}
          </div>
        )}

        <div
          data-testid="upload-dropzone"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: dragActive ? "2px solid #f50" : "2px dashed #555",
            borderRadius: "10px",
            padding: "60px 20px",
            textAlign: "center",
            backgroundColor: dragActive ? "rgba(255,85,0,0.08)" : "#1a1a1a",
            transition: "all 0.2s",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎵</div>
          <p style={{ color: "#ccc", marginBottom: "8px" }}>
            Drag and drop your audio file here
          </p>
          <p style={{ color: "#666", fontSize: "13px", marginBottom: "20px" }}>
            MP3, FLAC, WAV, AAC — max {AUDIO_MAX_MB} MB
          </p>
          <label
            data-testid="upload-choose-files-btn"
            style={{
              padding: "10px 24px",
              backgroundColor: "#f50",
              color: "white",
              borderRadius: "4px",
              cursor: "pointer",
              display: "inline-block",
              fontWeight: "bold",
            }}
          >
            Choose File
            <input
              data-testid="upload-file-input"
              ref={audioInputRef}
              type="file"
              onChange={handleAudioChange}
              style={{ display: "none" }}
              accept={AUDIO_ACCEPT}
            />
          </label>
        </div>
      </div>
    );
  }

  // ── Step: Metadata ───────────────────────────────────────────
  if (step === STEPS.METADATA) {
    return (
      <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
        <button
          onClick={() => {
            setStep(STEPS.SELECT);
            setAudioFile(null);
            setUploadError("");
          }}
          style={{
            background: "none",
            border: "none",
            color: "#f50",
            cursor: "pointer",
            fontSize: "14px",
            padding: 0,
            marginBottom: "16px",
          }}
        >
          ← Choose a different file
        </button>
        <h1 style={{ marginTop: 0 }}>Track Details</h1>

        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "#1a1a1a",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#aaa",
          }}
        >
          🎵 <strong style={{ color: "#fff" }}>{audioFile?.name}</strong>
          <span style={{ marginLeft: "8px" }}>
            ({(audioFile?.size / 1024 / 1024).toFixed(1)} MB)
          </span>
        </div>

        {uploadError && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "rgba(255,85,0,0.12)",
              border: "1px solid #f50",
              borderRadius: "6px",
              color: "#f50",
              marginBottom: "16px",
            }}
          >
            {uploadError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {/* Artwork */}
          <div>
            <label style={labelStyle}>
              Cover Artwork <span style={{ color: "#f50" }}>*</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {artworkPreview ? (
                <img
                  src={artworkPreview}
                  alt="preview"
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    border: "1px solid #444",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    backgroundColor: "#222",
                    borderRadius: "6px",
                    border: "1px dashed #555",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#555",
                    fontSize: "24px",
                  }}
                >
                  🖼️
                </div>
              )}
              <div>
                <label
                  style={{
                    padding: "8px 14px",
                    backgroundColor: "#333",
                    color: "#fff",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "inline-block",
                    fontSize: "13px",
                  }}
                >
                  {artworkPreview ? "Change Image" : "Upload Image"}
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    onChange={handleArtworkChange}
                    style={{ display: "none" }}
                  />
                </label>
                <p
                  style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}
                >
                  JPEG, PNG, WebP — max {IMAGE_MAX_MB} MB
                </p>
                {fieldErrors.artwork && (
                  <p style={errorStyle}>{fieldErrors.artwork}</p>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>
              Title <span style={{ color: "#f50" }}>*</span>
            </label>
            <input
              data-testid="meta-title-input"
              type="text"
              maxLength={100}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                ...inputStyle,
                borderColor: fieldErrors.title ? "#f55" : "#444",
              }}
            />
            {fieldErrors.title && <p style={errorStyle}>{fieldErrors.title}</p>}
          </div>

          {/* Genre */}
          <div>
            <label style={labelStyle}>
              Genre <span style={{ color: "#f50" }}>*</span>
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              required
              style={{
                ...inputStyle,
                borderColor: fieldErrors.genre ? "#f55" : "#444",
              }}
            >
              <option value="">Select a genre...</option>
              {TRACK_GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {fieldErrors.genre && <p style={errorStyle}>{fieldErrors.genre}</p>}
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>
              Description <span style={{ color: "#888" }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="A short description of your track..."
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
            <p
              style={{
                color: "#555",
                fontSize: "11px",
                textAlign: "right",
                marginTop: "2px",
              }}
            >
              {description.length}/200
            </p>
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>
              Tags{" "}
              <span style={{ color: "#888" }}>(optional, comma-separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. chill, workout, lofi"
              style={inputStyle}
            />
          </div>

          {/* Visibility + Preview start */}
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                Preview Start <span style={{ color: "#888" }}>(seconds)</span>
              </label>
              <input
                type="number"
                min="0"
                value={previewStart}
                onChange={(e) => setPreviewStart(e.target.value)}
                placeholder="e.g. 45"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  paddingBottom: "10px",
                }}
              >
                <input
                  data-testid="meta-public-toggle"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#f50" }}
                />
                <span style={{ color: "#ccc", fontSize: "14px" }}>
                  Make public
                </span>
              </label>
            </div>
          </div>

          {/* Lyrics */}
          <div>
            <label style={labelStyle}>
              Lyrics <span style={{ color: "#888" }}>(optional)</span>
            </label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              maxLength={10000}
              rows={6}
              placeholder="Paste your lyrics here..."
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          <button
            data-testid="meta-submit-btn"
            type="submit"
            style={{
              padding: "14px",
              backgroundColor: "#f50",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "15px",
              marginTop: "8px",
            }}
          >
            Upload Track
          </button>
        </form>
      </div>
    );
  }

  // ── Step: Uploading ──────────────────────────────────────────
  if (step === STEPS.UPLOADING) {
    const statusLabel =
      processingStatus?.status === "uploading"
        ? "Uploading..."
        : `Processing${processingStatus?.progress_percent != null ? ` (${processingStatus.progress_percent}%)` : "..."}`;
    return (
      <div
        style={{
          padding: "20px",
          maxWidth: "500px",
          margin: "0 auto",
          textAlign: "center",
          paddingTop: "80px",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
        <h2 style={{ marginBottom: "8px" }}>{statusLabel}</h2>
        <p style={{ color: "#888", fontSize: "14px" }}>
          {processingStatus?.status === "uploading"
            ? "Sending your file to the server..."
            : "Your track is being transcoded. This usually takes under a minute."}
        </p>
        <div
          style={{
            marginTop: "24px",
            height: "4px",
            backgroundColor: "#222",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              backgroundColor: "#f50",
              borderRadius: "2px",
              width:
                processingStatus?.progress_percent != null
                  ? `${processingStatus.progress_percent}%`
                  : "60%",
            }}
          />
        </div>
      </div>
    );
  }

  // ── Step: Done ───────────────────────────────────────────────
  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "500px",
        margin: "0 auto",
        textAlign: "center",
        paddingTop: "80px",
      }}
    >
      <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
      <h2 style={{ marginBottom: "8px" }}>Track Published!</h2>
      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        <strong style={{ color: "#fff" }}>{title}</strong> is live and ready to
        play.
      </p>
      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {createdTrackId && (
          <button
            onClick={() => navigate(`/tracks/${createdTrackId}`)}
            style={{
              padding: "12px 24px",
              backgroundColor: "#f50",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            View Track
          </button>
        )}
        <button
          onClick={resetAll}
          style={{
            padding: "12px 24px",
            backgroundColor: "#333",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Upload Another
        </button>
      </div>
    </div>
  );
};
