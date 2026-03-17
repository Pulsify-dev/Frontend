import React, { useState } from 'react';

export const PulsifyMetadataForm = ({ file, onSubmit }) => {
  const [title, setTitle] = useState(file ? file.name : '');
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, genre, tags, releaseDate, isPublic, file });
  };

  return (
    <div style={{ backgroundColor: '#111', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
      <h3 style={{ marginTop: 0 }}>Track Metadata: {file?.name}</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Title</label>
          <input 
            data-testid="meta-title-input"
            type="text" 
            required 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            style={{ width: '100%', padding: '10px', backgroundColor: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Genre</label>
            <input 
              type="text" 
              value={genre} 
              onChange={(e) => setGenre(e.target.value)} 
              placeholder="e.g. Hip-Hop, House"
              style={{ width: '100%', padding: '10px', backgroundColor: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Release Date</label>
            <input 
              type="date" 
              value={releaseDate} 
              onChange={(e) => setReleaseDate(e.target.value)} 
              style={{ width: '100%', padding: '10px', backgroundColor: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px', colorScheme: 'dark', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Descriptive Tags (comma separated)</label>
          <input 
            type="text" 
            value={tags} 
            onChange={(e) => setTags(e.target.value)} 
            placeholder="e.g. chill, workout, podcast"
            style={{ width: '100%', padding: '10px', backgroundColor: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ padding: '15px', backgroundColor: '#222', borderRadius: '4px', borderLeft: '4px solid #f50' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
            <input 
              data-testid="meta-public-toggle"
              type="checkbox" 
              checked={isPublic} 
              onChange={(e) => setIsPublic(e.target.checked)} 
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontWeight: 'bold' }}>Public Track (Searchable)</span>
          </label>
          <p style={{ margin: '5px 0 0 26px', fontSize: '12px', color: '#888' }}>
            If unchecked, this track will be Private and only accessible via a direct link.
          </p>
        </div>

        {/* Mock Waveform Generation Area */}
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '10px' }}>Generating Core Waveform...</p>
          <div style={{ display: 'flex', alignItems: 'center', height: '40px', gap: '2px' }}>
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} style={{ flex: 1, backgroundColor: '#f50', height: `${Math.max(20, Math.random() * 100)}%`, opacity: 0.8, borderRadius: '2px' }}></div>
            ))}
          </div>
        </div>

        <button data-testid="meta-submit-btn" type="submit" style={{ padding: '12px', backgroundColor: '#f50', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
          Save & Publish Metadata
        </button>
      </form>
    </div>
  );
};
