import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_TRACK_ID = import.meta.env.VITE_TRACK_ID ?? "trk-2026-014";

function AppHeader() {
  const { user } = useAuth();
  const isArtist = user?.role === "artist";

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-left">
          <Link
            className="brand"
            to={`/tracks/${DEFAULT_TRACK_ID}`}
            aria-label="Pulsify home"
          >
            <span className="logo-cloud" aria-hidden="true" />
          </Link>

          <nav className="main-nav" aria-label="Primary">
            <NavLink
              className={({ isActive }) => (isActive ? "active" : "")}
              to={`/tracks/${DEFAULT_TRACK_ID}`}
              end
            >
              Home
            </NavLink>
            <NavLink
              className={({ isActive }) => (isActive ? "active" : "")}
              to={`/tracks/${DEFAULT_TRACK_ID}/comments`}
            >
              Feed
            </NavLink>
            <NavLink
              className={({ isActive }) => (isActive ? "active" : "")}
              to="/playlists"
            >
              Library
            </NavLink>
            <NavLink
              className={({ isActive }) => (isActive ? "active" : "")}
              to={`/tracks/${DEFAULT_TRACK_ID}`}
            >
              Track
            </NavLink>
          </nav>
        </div>

        <div className="topbar-search">
          <input
            className="search"
            type="text"
            placeholder="Search"
            aria-label="Search"
          />
        </div>

        <div className="topbar-actions">
          <Link className="upgrade-link" to="/premium">
            Upgrade now
          </Link>
          <Link className="text-action" to="/profile">
            Artist Studio
          </Link>
          {isArtist && (
            <Link className="text-action" to="/upload">
              Upload
            </Link>
          )}
          <Link className="profile-chip" to="/profile" aria-label="Profile">
            <span />
          </Link>
          <Link
            className="text-action"
            to="/settings"
            aria-label="Settings"
            title="Settings"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ verticalAlign: "middle" }}
            >
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96a7.02 7.02 0 00-1.62-.94l-.36-2.54A.484.484 0 0014 2h-4a.484.484 0 00-.48.41l-.36 2.54a7.4 7.4 0 00-1.62.94l-2.39-.96a.48.48 0 00-.59.22L2.74 8.87a.47.47 0 00.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.36 1.04.67 1.62.94l.36 2.54c.05.24.27.41.49.41h4c.22 0 .43-.17.47-.41l.36-2.54a7.4 7.4 0 001.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 00-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 118.4 12 3.6 3.6 0 0112 15.6z" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
