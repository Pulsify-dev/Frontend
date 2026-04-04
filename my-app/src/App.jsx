import { Navigate, Route, Routes } from 'react-router-dom'
import AppHeader from './components/AppHeader'
import { PulsifyPlaylistDetailView } from './pages/PulsifyPlaylistDetailView'
import { PulsifyPlaylistsView } from './pages/PulsifyPlaylistsView'
import { PulsifyPremiumUpgradePage } from './pages/PulsifyPremiumUpgradePage'
import { PulsifyTrackUploadScreen } from './pages/PulsifyTrackUploadScreen'
import TrackPage from './pages/TrackPage'
import ProfilePage from './profile/pages/ProfilePage'
import './App.css'

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
        <Route
          path="/trackpage"
          element={<Navigate to="/tracks/trk-2026-014" replace />}
        />
        <Route
          path="/tracks/:trackId"
          element={
            <>
              <AppHeader />
              <TrackPage />
            </>
          }
        />
      </Routes>
    </div>
  )
}

export default App
