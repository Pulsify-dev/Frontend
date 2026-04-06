/**
 * App Routes Configuration
 * Simplified routes for page demos
 */

import { Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";

// Auth
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";

// Module pages
import { HomeFeedPage } from "@/pages/HomeFeedPage";
import DiscoveryFeedPage from "@/pages/DiscoveryFeedPage";
import SearchHubPage from "@/pages/SearchHubPage";
import TrendingChartsPage from "@/pages/TrendingChartsPage";
import TrackPage from "@/pages/TrackPage";
import { PulsifyPlaylistsView } from "@/pages/PulsifyPlaylistsView";
import { PulsifyPlaylistDetailView } from "@/pages/PulsifyPlaylistDetailView";
import { PulsifyTrackUploadScreen } from "@/pages/PulsifyTrackUploadScreen";
import { PulsifyPremiumUpgradePage } from "@/pages/PulsifyPremiumUpgradePage";

// Profile
import ProfilePage from "@/profile/pages/ProfilePage";

// Module 3 – Social Graph
import FollowingPage from "@/social/pages/FollowingPage";
import FollowersPage from "@/social/pages/FollowersPage";
import BlockedUsersPage from "@/social/pages/BlockedUsersPage";

const AppRoutes = () => {
  return (
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

        {/* Social Graph - Module 3 */}
        <Route path="/following" element={<FollowingPage />} />
        <Route path="/following/:userId" element={<FollowingPage />} />
        <Route path="/followers" element={<FollowersPage />} />
        <Route path="/followers/:userId" element={<FollowersPage />} />
        <Route path="/blocked" element={<BlockedUsersPage />} />

        {/* Feed - Module 8 */}
        <Route path="/feed" element={<HomeFeedPage />} />

        {/* Discovery - Module 8 */}
        <Route path="/discover" element={<DiscoveryFeedPage />} />

        {/* Search - Module 8 */}
        <Route path="/search" element={<SearchHubPage />} />

        {/* Trending - Module 8 */}
        <Route path="/trending" element={<TrendingChartsPage />} />

        {/* Track - Module 4/5 */}
        <Route path="/track/:id" element={<TrackPage />} />

        {/* Playlists - Module 7 */}
        <Route path="/playlists" element={<PulsifyPlaylistsView />} />
        <Route path="/playlists/:id" element={<PulsifyPlaylistDetailView />} />

        {/* Upload - Module 4 */}
        <Route path="/upload" element={<PulsifyTrackUploadScreen />} />

        {/* Premium - Module 12 */}
        <Route path="/premium" element={<PulsifyPremiumUpgradePage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
