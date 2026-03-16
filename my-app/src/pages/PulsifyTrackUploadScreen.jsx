import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PulsifyMetadataForm } from '../components/upload/PulsifyMetadataForm';

export const PulsifyTrackUploadScreen = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setUploadedFiles(files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
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
              type="file" 
              multiple 
              onChange={handleChange} 
              style={{ display: 'none' }}
              accept=".mp3,.wav,audio/*"
            />
          </label>
        </div>
      </form>

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
