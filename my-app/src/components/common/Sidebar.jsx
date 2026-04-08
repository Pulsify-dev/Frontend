import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Sidebar Component
 * Global sidebar navigation with role-based menu items
 */

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function PlaylistIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function CollapseIcon({ isCollapsed }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

const Sidebar = ({ isCollapsed = false, onToggle }) => {
  const { user, isAuthenticated, isArtist } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(isCollapsed);

  const handleToggle = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    onToggle?.(newState);
  };

  const isActiveLink = (path) => {
    if (path === "/home") return location.pathname === "/home" || location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Base navigation items (for all users)
  const baseNavItems = [
    { name: "Home", path: "/home", icon: HomeIcon },
    { name: "Search", path: "/search", icon: SearchIcon },
  ];

  // Authenticated user items
  const authNavItems = [
    { name: "Library", path: "/library", icon: LibraryIcon },
    { name: "Playlists", path: "/playlists", icon: PlaylistIcon },
    { name: "Liked", path: "/liked", icon: HeartIcon },
  ];

  // Artist-only items
  const artistNavItems = [
    { name: "Upload", path: "/upload", icon: UploadIcon },
    { name: "Stats", path: "/stats", icon: ChartIcon },
  ];

  // Bottom items
  const bottomNavItems = [
    { name: "Profile", path: "/profile", icon: UserIcon, requiresAuth: true },
    { name: "Settings", path: "/settings", icon: SettingsIcon, requiresAuth: true },
  ];

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = isActiveLink(item.path);

    return (
      <Link
        key={item.name}
        to={item.path}
        className={`sidebar-nav-item${isActive ? " active" : ""}${collapsed ? " collapsed" : ""}`}
        title={collapsed ? item.name : undefined}
      >
        <Icon />
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  return (
    <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <div className="sidebar-header">
        <Link to="/home" className="sidebar-logo-link">

          {!collapsed && <span className="sidebar-logo-text">Pulsify</span>}
        </Link>
        <button onClick={handleToggle} className="sidebar-toggle" aria-label="Toggle sidebar">
          <CollapseIcon isCollapsed={collapsed} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          {baseNavItems.map(renderNavItem)}
        </div>

        {isAuthenticated && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section">
              {!collapsed && <span className="sidebar-section-title">Your Library</span>}
              {authNavItems.map(renderNavItem)}
            </div>
          </>
        )}

        {isAuthenticated && isArtist() && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section">
              {!collapsed && <span className="sidebar-section-title">Artist Tools</span>}
              {artistNavItems.map(renderNavItem)}
            </div>
          </>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-divider" />
        {isAuthenticated ? (
          <>
            {bottomNavItems
              .filter((item) => !item.requiresAuth || isAuthenticated)
              .map(renderNavItem)}
            {!collapsed && user && (
              <div className="sidebar-user">
                <img
                  src={user.avatarUrl || "https://i1.sndcdn.com/avatars-default.jpg"}
                  alt={user.displayName}
                  className="sidebar-user-avatar"
                />
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name">{user.displayName}</span>
                  <span className="sidebar-user-role">{user.role}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          !collapsed && (
            <div className="sidebar-auth-prompt">
              <p>Sign in to access your library</p>
              <Link to="/login" className="sidebar-signin-btn">
                Sign in
              </Link>
            </div>
          )
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
