import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import { PulsifyPlaylistsView } from "@/pages/PulsifyPlaylistsView";
import { PulsifyPlaylistDetailView } from "@/pages/PulsifyPlaylistDetailView";
import { PulsifyTrackUploadScreen } from "@/pages/PulsifyTrackUploadScreen";
import { PulsifyPremiumUpgradePage } from "@/pages/PulsifyPremiumUpgradePage";
import TrackPage from "@/pages/TrackPage";
import ProfilePage from "@/profile/pages/ProfilePage";
const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route path="/playlists" element={<PulsifyPlaylistsView />} />
      <Route
        path="/playlists/:playlistId"
        element={<PulsifyPlaylistDetailView />}
      />
      <Route path="/upload" element={<PulsifyTrackUploadScreen />} />
      <Route path="/premium" element={<PulsifyPremiumUpgradePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/trackpage" element={<TrackPage />} />
    </Routes>
  );
};

export default AppRoutes;
