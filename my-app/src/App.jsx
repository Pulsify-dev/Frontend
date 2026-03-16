import { Routes, Route, Navigate } from 'react-router-dom';
import { PulsifyPlaylistsView } from './pages/PulsifyPlaylistsView';
import { PulsifyPlaylistDetailView } from './pages/PulsifyPlaylistDetailView';
import { PulsifyTrackUploadScreen } from './pages/PulsifyTrackUploadScreen';
import './App.css';

function App() {
  return (
    <div className="pulsify-app-container">
      {/* 
        Temporarily routing the root "/" to "/playlists" 
      */}
      <Routes>
        <Route path="/" element={<Navigate to="/playlists" replace />} />
        <Route path="/playlists" element={<PulsifyPlaylistsView />} />
        <Route path="/playlists/:playlistId" element={<PulsifyPlaylistDetailView />} />
        <Route path="/upload" element={<PulsifyTrackUploadScreen />} />
      </Routes>
    </div>
  );
}

export default App;
