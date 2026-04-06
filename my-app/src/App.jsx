import { Routes, Route } from "react-router-dom";
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

import { NotificationProvider } from "./context/NotificationContext";
import { PlayerProvider } from "./context/PlayerContext";
import PulsifyPlayerBar from "./components/common/PulsifyPlayerBar";
import DiscoveryFeedPage from "./pages/DiscoveryFeedPage";
import SearchHubPage from "./pages/SearchHubPage";
import TrendingChartsPage from "./pages/TrendingChartsPage";

import FollowingPage from "@/social/pages/FollowingPage";
import FollowersPage from "@/social/pages/FollowersPage";
import BlockedUsersPage from "@/social/pages/BlockedUsersPage";
const AppRoutes = () => {
  return (
    <NotificationProvider>
      <PlayerProvider>
        <>
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

            <Route path="/following" element={<FollowingPage />} />
            <Route path="/following/:userId" element={<FollowingPage />} />
            <Route path="/followers" element={<FollowersPage />} />
            <Route path="/followers/:userId" element={<FollowersPage />} />
            <Route path="/blocked" element={<BlockedUsersPage />} />
            {/* Discovery / Notifications pages */}
            <Route path="/feed" element={<DiscoveryFeedPage />} />
            <Route path="/search" element={<SearchHubPage />} />
            <Route path="/trending" element={<TrendingChartsPage />} />
          </Routes>

          <PulsifyPlayerBar />
        </>
      </PlayerProvider>
    </NotificationProvider>
  );
};

export default AppRoutes;
