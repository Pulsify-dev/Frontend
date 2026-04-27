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
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
