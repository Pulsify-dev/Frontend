import { Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Unauthorized from "@/pages/Unauthorized";
import Home from "@/pages/Home";
import { PulsifyPlaylistsView } from "@/pages/PulsifyPlaylistsView";
import { PulsifyPlaylistDetailView } from "@/pages/PulsifyPlaylistDetailView";
import { PulsifyTrackUploadScreen } from "@/pages/PulsifyTrackUploadScreen";
import { PulsifyPremiumUpgradePage } from "@/pages/PulsifyPremiumUpgradePage";
import TrackPage from "@/pages/TrackPage";
import ProfilePage from "@/profile/pages/ProfilePage";
import { ProtectedRoute, ArtistRoute } from "@/components/auth";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/home" element={<Home />} />
      </Route>

      {/* Public Routes */}
      <Route path="/playlists" element={<PulsifyPlaylistsView />} />
      <Route path="/playlists/:playlistId" element={<PulsifyPlaylistDetailView />} />
      <Route path="/trackpage" element={<TrackPage />} />
      <Route path="/premium" element={<PulsifyPremiumUpgradePage />} />

      {/* Protected Routes - Require Authentication */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <PulsifyPlaylistsView />
          </ProtectedRoute>
        }
      />

      {/* Artist-Only Routes */}
      <Route
        path="/upload"
        element={
          <ArtistRoute>
            <PulsifyTrackUploadScreen />
          </ArtistRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
