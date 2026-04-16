import { Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";

// Auth (Seif)
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";

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
      {/* Auth pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      {/* App pages */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<DiscoveryFeedPage />} />

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
        <Route path="/discover" element={<DiscoveryFeedPage />} />
        <Route path="/search" element={<SearchHubPage />} />
        <Route path="/trending" element={<TrendingChartsPage />} />

        {/* Track - Module 4/5 */}
        <Route path="/trackpage" element={<TrackPage />} />
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
