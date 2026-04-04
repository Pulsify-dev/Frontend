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

// Module 3 – Social Graph
import FollowingPage from "@/social/pages/FollowingPage";
import FollowersPage from "@/social/pages/FollowersPage";
import BlockedUsersPage from "@/social/pages/BlockedUsersPage";

import { NotificationProvider } from "./context/NotificationContext";
import { PlayerProvider } from "./context/PlayerContext";
import PulsifyPlayerBar from "./components/common/PulsifyPlayerBar";
import DiscoveryFeedPage from "./pages/DiscoveryFeedPage";
import SearchHubPage from "./pages/SearchHubPage";
import TrendingChartsPage from "./pages/TrendingChartsPage";

const AppRoutes = () => {
  return (
    <NotificationProvider>
      <PlayerProvider>
        <>
          <Routes>
            <Route element={<MainLayout />}>
              {/* Auth */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Profile - Module 2 */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />

              {/* Module 3 – Social Graph */}
              <Route path="/following" element={<FollowingPage />} />
              <Route path="/following/:userId" element={<FollowingPage />} />
              <Route path="/followers" element={<FollowersPage />} />
              <Route path="/followers/:userId" element={<FollowersPage />} />
              <Route path="/blocked" element={<BlockedUsersPage />} />

              {/* Playlists - Module 7 */}
              <Route path="/playlists" element={<PulsifyPlaylistsView />} />
              <Route
                path="/playlists/:playlistId"
                element={<PulsifyPlaylistDetailView />}
              />

              {/* Upload - Module 4 */}
              <Route path="/upload" element={<PulsifyTrackUploadScreen />} />

              {/* Track - Module 4/5 */}
              <Route path="/trackpage" element={<TrackPage />} />

              {/* Premium - Module 12 */}
              <Route path="/premium" element={<PulsifyPremiumUpgradePage />} />

              {/* Discovery / Notifications - Module 8 */}
              <Route path="/feed" element={<DiscoveryFeedPage />} />
              <Route path="/search" element={<SearchHubPage />} />
              <Route path="/trending" element={<TrendingChartsPage />} />
            </Route>
          </Routes>

          <PulsifyPlayerBar />
        </>
      </PlayerProvider>
    </NotificationProvider>
  );
};

export default AppRoutes;
