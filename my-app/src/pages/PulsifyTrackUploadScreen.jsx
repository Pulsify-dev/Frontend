import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PulsifyMetadataForm } from '../components/upload/PulsifyMetadataForm';

export const PulsifyTrackUploadScreen = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Mock Paywall State (Free Tier User with 3 uploads already)
  const [isPremium, setIsPremium] = useState(false);
  const [uploadCount, setUploadCount] = useState(3);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!isPremium && uploadCount >= 3) {
      alert("You have reached your Free Tier upload limit (3/3 tracks). Upgrade to Pro for unlimited uploads!");
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setUploadedFiles(files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();

    if (!isPremium && uploadCount >= 3) {
      alert("You have reached your Free Tier upload limit (3/3 tracks). Upgrade to Pro for unlimited uploads!");
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      setUploadedFiles(files);
    }
  };

  const handleMetadataSubmit = (data) => {
    console.log('Metadata Saved for', data.file.name, data);
    // Simulating save logic
    alert(`Track "${data.title}" has been saved and is now ${data.isPublic ? 'Public' : 'Private'}!`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/playlists" style={{ marginBottom: '20px', display: 'inline-block', color: '#f50', textDecoration: 'none' }}>
        &larr; Back to Sets
      </Link>
      
      <h1>Upload to Pulsify</h1>
      
      <form 
        onDragEnter={handleDrag} 
        onSubmit={(e) => e.preventDefault()}
        style={{ marginTop: '20px' }}
      >
        <div 
          data-testid="upload-dropzone"
          style={{
            border: dragActive ? '2px solid #f50' : '2px dashed #666',
            borderRadius: '8px',
            padding: '50px',
            textAlign: 'center',
            backgroundColor: dragActive ? 'rgba(255,85,0,0.1)' : '#1a1a1a',
            position: 'relative'
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <p style={{ color: '#ccc', marginBottom: '15px' }}>
            Drag and drop your audio files here (MP3, WAV, High-Bitrate)
          </p>
          <label 
            data-testid="upload-choose-files-btn"
            style={{
              padding: '10px 20px',
              backgroundColor: '#f50',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'inline-block'
            }}
          >
            Choose Files
            <input 
              data-testid="upload-file-input"
              type="file" 
              multiple 
              onChange={handleChange} 
              style={{ display: 'none' }}
              accept=".mp3,.wav,audio/*"
            />
          </label>
        </div>
      </form>

      {!isPremium && uploadCount >= 3 && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(226, 33, 52, 0.1)', border: '1px solid #e22134', borderRadius: '4px', textAlign: 'center' }}>
          <p style={{ color: '#e22134', margin: '0 0 10px 0', fontWeight: 'bold' }}>Upload Limit Reached (3/3)</p>
          <p style={{ color: '#aaa', margin: '0 0 15px 0', fontSize: '14px' }}>Free tier allows a maximum of 3 tracks.</p>
          <Link to="/premium" data-testid="upload-upgrade-btn" style={{ padding: '8px 16px', backgroundColor: '#f50', color: 'white', textDecoration: 'none', borderRadius: '4px', display: 'inline-block' }}>
            Upgrade to Pro
          </Link>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Editing Metadata ({uploadedFiles.length})</h3>
          {uploadedFiles.map((file, i) => (
            <PulsifyMetadataForm key={i} file={file} onSubmit={handleMetadataSubmit} />
          ))}
        </div>
      )}
    </div>
  );
};
