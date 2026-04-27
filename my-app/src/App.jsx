import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import "./App.css";

// Module 1 – Auth (Seif Allah Alaa)
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Unauthorized from "@/pages/Unauthorized";
import Home from "@/pages/Home";
import { ProtectedRoute, ArtistRoute, AdminRoute } from "@/components/auth";

// Module 2 – Profile (Ahmad Hisham)
import ProfilePage from "@/profile/pages/ProfilePage";

// Module 3 – Social Graph (Ahmad Hisham)
import FollowingPage from "@/social/pages/FollowingPage";
import FollowersPage from "@/social/pages/FollowersPage";
import BlockedUsersPage from "@/social/pages/BlockedUsersPage";

// Module 4/5/6 – Tracks, Playback & Engagement (Mayar Ayman)
import TrackPage from "@/pages/TrackPage";

// Module 7 + 12 – Playlists & Premium (Omar Nasser)
import { PulsifyPlaylistsView } from "@/pages/PulsifyPlaylistsView";
import { PulsifyLibraryPlaylists } from "@/pages/PulsifyLibraryPlaylists";
import { PulsifyPlaylistDetailView } from "@/pages/PulsifyPlaylistDetailView";
import { PulsifyTrackUploadScreen } from "@/pages/PulsifyTrackUploadScreen";
import { PulsifyMyTracksView } from "@/pages/PulsifyMyTracksView";
import { PulsifyPremiumUpgradePage } from "@/pages/PulsifyPremiumUpgradePage";

// Module 13 – Albums (Omar Nasser)
import { PulsifyAlbumDetailView } from "@/pages/PulsifyAlbumDetailView";

// Module 8/10 – Discovery & Notifications (Ahmed Ali)
import { NotificationProvider } from "./context/NotificationContext";
import { PlayerProvider } from "./context/PlayerContext";
import PulsifyPlayerBar from "./components/common/PulsifyPlayerBar";
import DiscoveryFeedPage from "./pages/DiscoveryFeedPage";
import FeedPage from "./pages/FeedPage";
import SearchHubPage from "./pages/SearchHubPage";
import TrendingChartsPage from "./pages/TrendingChartsPage";
import NotificationsPage from "./pages/NotificationsPage";

// Module 11 - Admin & Moderation
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminContentModerationPage from "./pages/AdminContentModerationPage";
import AdminUserManagementPage from "./pages/AdminUserManagementPage";
import AdminTracksManagementPage from "./pages/AdminTracksManagementPage";
import AdminAlbumsManagementPage from "./pages/AdminAlbumsManagementPage";
import AdminSystemLogsPage from "./pages/AdminSystemLogsPage";
import ResourceResolverPage from "./pages/ResourceResolverPage";

const AppRoutes = () => {
  const location = useLocation();
  const isUploadPage = location.pathname.startsWith('/upload');

  return (
    <NotificationProvider>
      <PlayerProvider>
        <>
          <Routes>
            {/* Auth pages – minimal navbar */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
            </Route>

            {/* Landing – no layout wrapper, manages its own navbar */}
            <Route path="/" element={<LandingPage />} />

            {/* App pages – full navbar */}
            <Route element={<MainLayout />}>
              <Route path="/home" element={<Home />} />

              {/* Profile - Module 2 (Protected) */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/profile/:userId" element={<ProfilePage />} />

              {/* Social Graph - Module 3 */}
              <Route path="/following" element={<FollowingPage />} />
              <Route path="/following/:userId" element={<FollowingPage />} />
              <Route path="/followers" element={<FollowersPage />} />
              <Route path="/followers/:userId" element={<FollowersPage />} />
              <Route path="/blocked" element={<BlockedUsersPage />} />

              {/* Tracks & Engagement - Module 4/5/6 */}
              <Route
                path="/trackpage"
                element={
                  <Navigate
                    to={`/tracks/${import.meta.env.VITE_TRACK_ID ?? "trk-2026-014"}`}
                    replace
                  />
                }
              />
              <Route
                path="/tracks/:trackId"
                element={<TrackPage view="overview" />}
              />
              <Route
                path="/tracks/:trackId/comments"
                element={<TrackPage view="comments" />}
              />
              <Route
                path="/tracks/:trackId/related"
                element={<TrackPage view="related" />}
              />
              <Route
                path="/tracks/:trackId/playlists"
                element={<TrackPage view="playlists" />}
              />
              <Route
                path="/tracks/:trackId/likes"
                element={<TrackPage view="likes" />}
              />
              <Route
                path="/tracks/:trackId/reposts"
                element={<TrackPage view="reposts" />}
              />

              {/* Playlists - Module 7 */}
              <Route path="/playlists" element={<PulsifyPlaylistsView />} />
              <Route
                path="/playlists/:playlistId"
                element={<PulsifyPlaylistDetailView />}
              />


              {/* Library (Protected) */}
              <Route
                path="/library"
                element={
                  <ProtectedRoute>
                    <PulsifyLibraryPlaylists />
                  </ProtectedRoute>
                }
              />

              {/* Premium - Module 12 */}
              <Route path="/premium" element={<PulsifyPremiumUpgradePage />} />

              {/* Discovery & Notifications - Module 8/10 */}
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/discover" element={<DiscoveryFeedPage />} />
              <Route path="/search" element={<SearchHubPage />} />
              <Route path="/trending" element={<TrendingChartsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              } />
              <Route path="/admin/moderation" element={
                <AdminRoute>
                  <AdminContentModerationPage />
                </AdminRoute>
              } />
              <Route path="/admin/users" element={
                <AdminRoute>
                  <AdminUserManagementPage />
                </AdminRoute>
              } />
              <Route path="/admin/tracks" element={
                <AdminRoute>
                  <AdminTracksManagementPage />
                </AdminRoute>
              } />
              <Route path="/admin/albums" element={
                <AdminRoute>
                  <AdminAlbumsManagementPage />
                </AdminRoute>
              } />
              <Route path="/admin/logs" element={
                <AdminRoute>
                  <AdminSystemLogsPage />
                </AdminRoute>
              } />
              
              {/* Resource Resolver (Wildcard) - MUST BE LAST IN MAIN LAYOUT */}
              <Route path="/*" element={<ResourceResolverPage />} />
            </Route>

            {/* Upload & My Tracks (standalone, no navbar) */}
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <PulsifyTrackUploadScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-tracks"
              element={
                <ProtectedRoute>
                  <PulsifyMyTracksView />
                </ProtectedRoute>
              }
            />
          </Routes>

          {!isUploadPage && <PulsifyPlayerBar />}
        </>
      </PlayerProvider>
    </NotificationProvider>
  );
};

export default AppRoutes;
