import { Routes, Route, Navigate } from "react-router-dom";
import { PulsifyPlaylistsView } from "./pages/PulsifyPlaylistsView";
import { PulsifyPlaylistDetailView } from "./pages/PulsifyPlaylistDetailView";
import { PulsifyTrackUploadScreen } from "./pages/PulsifyTrackUploadScreen";
import { PulsifyPremiumUpgradePage } from "./pages/PulsifyPremiumUpgradePage";
import ProfilePage from "./profile/pages/ProfilePage";
import "./App.css";

function App() {
  return (
    <div className="pulsify-app-container">
      <Routes>
        <Route path="/" element={<Navigate to="/playlists" replace />} />
        <Route path="/playlists" element={<PulsifyPlaylistsView />} />
        <Route
          path="/playlists/:playlistId"
          element={<PulsifyPlaylistDetailView />}
        />
        <Route path="/upload" element={<PulsifyTrackUploadScreen />} />
        <Route path="/premium" element={<PulsifyPremiumUpgradePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </div>
  );
}

export default App;