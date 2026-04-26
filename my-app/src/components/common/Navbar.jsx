import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMessaging } from "@/hooks/useMessaging";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isArtist, logout } = useAuth();
  const { unreadTotal } = useMessaging();
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Feed", path: "/feed" },
    { name: "Library", path: "/library" },
    { name: "Trending", path: "/trending" },
    { name: "Discover", path: "/discover" },
    { name: "TrackPage", path: "/trackpage" },
  ];

  const isActiveLink = (path) => {
    if (path === "/")
      return location.pathname === "/" || location.pathname === "/home";
    return location.pathname.startsWith(path);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate("/login");
  };

  const unreadLabel = unreadTotal > 99 ? "99+" : unreadTotal;

  return (
    <nav className="auth-navbar">
      <div className="auth-navbar-left">
        <Link to="/" className="navbar-logo-link">
          <span className="navbar-logo-text">Pulsify</span>
        </Link>
        <div className="auth-nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`auth-nav-link${isActiveLink(link.path) ? " active" : ""}`}
            >
              {link.name}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/messages"
              className={`auth-nav-link${location.pathname.startsWith("/messages") ? " active" : ""}`}
            >
              Messages{unreadTotal > 0 ? ` (${unreadLabel})` : ""}
            </Link>
          )}
        </div>
      </div>

      <div className="auth-navbar-right">
        <form onSubmit={handleSearch} className="auth-search-form">
          <input
            type="text"
            placeholder="Search for artists, bands, tracks, podcasts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="auth-search-input"
          />
          <button type="submit" className="auth-search-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </form>

        {isAuthenticated ? (
          <>
            <Link to="/premium" className="auth-nav-pro">
              Try Pro
            </Link>

            {isArtist() && (
              <Link to="/upload" className="auth-nav-upload-btn">
                Upload
              </Link>
            )}

            {/* User Menu */}
            <div className="auth-user-menu-container" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="auth-user-menu-trigger"
              >
                {user?.avatarUrl && !avatarError ? (
                  <img
                    src={user.avatarUrl}
                    alt={user?.displayName}
                    className="auth-user-avatar"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="auth-user-avatar auth-user-avatar--default">
                    {(user?.displayName?.[0] || "♪").toUpperCase()}
                  </span>
                )}
                <span className="auth-user-name">{user?.displayName}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`auth-user-chevron${isUserMenuOpen ? " open" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="auth-user-dropdown">
                  <div className="auth-user-dropdown-header">
                    {user?.avatarUrl && !avatarError ? (
                      <img
                        src={user.avatarUrl}
                        alt={user?.displayName}
                        className="auth-user-dropdown-avatar"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <span className="auth-user-dropdown-avatar auth-user-avatar--default">
                        {(user?.displayName?.[0] || "♪").toUpperCase()}
                      </span>
                    )}
                    <div className="auth-user-dropdown-info">
                      <span className="auth-user-dropdown-name">
                        {user?.displayName}
                      </span>
                      <span className="auth-user-dropdown-role">
                        {user?.role === "artist" ? "Artist" : "Listener"}
                      </span>
                    </div>
                  </div>
                  <div className="auth-user-dropdown-divider" />
                  <Link
                    to="/profile"
                    className="auth-user-dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile
                  </Link>
                  <Link
                    to="/following"
                    className="auth-user-dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                    Following
                  </Link>
                  {isArtist() && (
                    <Link
                      to="/stats"
                      className="auth-user-dropdown-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                      Stats
                    </Link>
                  )}
                  <div className="auth-user-dropdown-divider" />
                  <button
                    onClick={handleLogout}
                    className="auth-user-dropdown-item auth-user-dropdown-logout"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/premium" className="auth-nav-pro">
              Try Pro
            </Link>
            <Link to="/login" className="auth-nav-signin">
              Sign in
            </Link>
            <Link to="/register" className="auth-nav-register">
              Create account
            </Link>
          </>
        )}

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="auth-mobile-toggle"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="auth-mobile-menu">
          <form onSubmit={handleSearch} className="auth-mobile-search">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="auth-search-input"
            />
            <button type="submit" className="auth-search-btn">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </form>

          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`auth-mobile-link${isActiveLink(link.path) ? " active" : ""}`}
            >
              {link.name}
            </Link>
          ))}

          <hr className="auth-mobile-divider" />

          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="auth-mobile-link"
              >
                Profile
              </Link>
              <Link
                to="/following"
                onClick={() => setIsMobileMenuOpen(false)}
                className="auth-mobile-link"
              >
                Following
              </Link>
              <Link
                to="/messages"
                onClick={() => setIsMobileMenuOpen(false)}
                className="auth-mobile-link"
              >
                Messages{unreadTotal > 0 ? ` (${unreadLabel})` : ""}
              </Link>
              {isArtist() && (
                <Link
                  to="/upload"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="auth-mobile-link"
                >
                  Upload
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="auth-mobile-link auth-mobile-logout"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="auth-mobile-link"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="auth-mobile-link active"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
