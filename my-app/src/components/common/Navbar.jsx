import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import "../../css/navbar-soundcloud.css";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isArtist, logout } = useAuth();
  const userMenuRef = useRef(null);
  const overflowMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const messagesRef = useRef(null);

  // Close all other dropdowns when one opens
  const openDropdown = (setter) => {
    setIsUserMenuOpen(false);
    setIsOverflowOpen(false);
    setIsNotificationsOpen(false);
    setIsMessagesOpen(false);
    setter((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(event.target)) {
        setIsOverflowOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target)) {
        setIsMessagesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Feed", path: "/feed" },
    { name: "Library", path: "/library" },
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
        </div>
      </div>

      <form onSubmit={handleSearch} className="auth-search-form">
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

      <div className="auth-navbar-right">
        {isAuthenticated ? (
          <>
            <Link to="/premium" className="auth-nav-pro">
              Upgrade now
            </Link>

            <Link to="/my-tracks" className="auth-nav-text-link">
              For Artists
            </Link>

            <Link to="/upload" className="auth-nav-text-link">
              Upload
            </Link>

            {/* User Menu */}
            <div className="auth-user-menu-container" ref={userMenuRef}>
              <button
                onClick={() => openDropdown(setIsUserMenuOpen)}
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
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`auth-user-chevron${isUserMenuOpen ? " open" : ""}`}
                >
                  <path d="M20.5303 9.53033L12 18.0607L3.46967 9.53033L4.53033 8.46967L12 15.9393L19.4697 8.46967L20.5303 9.53033Z" fill="currentColor"/>
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="auth-user-dropdown">
                  <Link to="/profile" className="auth-user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    Profile
                  </Link>

                  {/* Likes — Module 6 */}
                  <Link to="/likes" className="auth-user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    Likes
                  </Link>

                  {/* Playlists - Module 7 */}
                  <Link to="/library" className="auth-user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 8h14v14H8z" /><path d="M4 16H2V4a2 2 0 0 1 2-2h12v2H4v12z" /></svg>
                    Playlists
                  </Link>

                  {/* Following — Module 3 */}
                  <Link to="/following" className="auth-user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    Following
                  </Link>

                  {/* Who to follow — Module 3 */}
                  <Link to="/discover" className="auth-user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                    Who to follow
                  </Link>

                  {/* Try Artist Pro — Module 12 (non-artists) */}
                  {!isArtist() && (
                    <Link to="/premium" className="auth-user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#f50"/><path d="M12 16.5l4.33 2.6-1.15-4.93L19 10.74l-5.04-.43L12 5.75l-1.96 4.56-5.04.43 3.82 3.43-1.15 4.93z" fill="#fff"/></svg>
                      Try Artist Pro
                    </Link>
                  )}

                  {/* Tracks — Module 4 (artists) */}
                  {isArtist() && (
                    <Link to="/my-tracks" className="auth-user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18h2V6H6v12zm4 4h2V2h-2v20zm4-16v12h2V6h-2z"/></svg>
                      Tracks
                    </Link>
                  )}

                  <div className="auth-user-dropdown-divider" />
                  <button
                    onClick={handleLogout}
                    className="auth-user-dropdown-item auth-user-dropdown-logout"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Bell — Notifications dropdown (Module 10) */}
            <div className="auth-notif-container" ref={notificationsRef}>
              <button
                className={`auth-nav-icon-btn${isNotificationsOpen ? ' active' : ''}`}
                title="Notifications"
                onClick={() => openDropdown(setIsNotificationsOpen)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>

              {isNotificationsOpen && (
                <div className="auth-panel-dropdown">
                  <div className="auth-panel-dropdown-header">
                    <span className="auth-panel-dropdown-title">Notifications</span>
                    <Link to="/settings" className="auth-panel-dropdown-settings" onClick={() => setIsNotificationsOpen(false)}>Settings</Link>
                  </div>
                  <div className="auth-panel-dropdown-body">
                    <div className="auth-panel-dropdown-empty">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                      <p>No notifications yet</p>
                    </div>
                  </div>
                  <Link to="/notifications" className="auth-panel-dropdown-footer" onClick={() => setIsNotificationsOpen(false)}>
                    View all notifications
                  </Link>
                </div>
              )}
            </div>

            {/* Envelope — Messages dropdown (Module 9) */}
            <div className="auth-messages-container" ref={messagesRef}>
              <button
                className={`auth-nav-icon-btn${isMessagesOpen ? ' active' : ''}`}
                title="Messages"
                onClick={() => openDropdown(setIsMessagesOpen)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </button>

              {isMessagesOpen && (
                <div className="auth-panel-dropdown">
                  <div className="auth-panel-dropdown-header">
                    <span className="auth-panel-dropdown-title">Messages</span>
                  </div>
                  <div className="auth-panel-dropdown-body">
                    <div className="auth-panel-dropdown-empty">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                      <p>No messages yet</p>
                    </div>
                  </div>
                  <Link to="/messages" className="auth-panel-dropdown-footer" onClick={() => setIsMessagesOpen(false)}>
                    View all messages
                  </Link>
                </div>
              )}
            </div>

            {/* Three-dot overflow menu */}
            <div className="auth-overflow-menu-container" ref={overflowMenuRef}>
              <button
                className="auth-nav-icon-btn"
                title="More"
                onClick={() => openDropdown(setIsOverflowOpen)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>

              {isOverflowOpen && (
                <div className="auth-overflow-dropdown">
                  {/* Group 1 — Info & Legal */}
                  <Link to="/about" className="auth-overflow-dropdown-item" onClick={() => setIsOverflowOpen(false)}>
                    About us
                  </Link>
                  <Link to="/legal" className="auth-overflow-dropdown-item" onClick={() => setIsOverflowOpen(false)}>
                    Legal
                  </Link>
                  <Link to="/copyright" className="auth-overflow-dropdown-item" onClick={() => setIsOverflowOpen(false)}>
                    Copyright
                  </Link>

                  <div className="auth-user-dropdown-divider" />

                  {/* Group 2 — Premium & Features (M12) */}
                  <Link to="/premium" className="auth-overflow-dropdown-item" onClick={() => setIsOverflowOpen(false)}>
                    Artist Membership
                  </Link>
                  <Link to="/keyboard-shortcuts" className="auth-overflow-dropdown-item" onClick={() => setIsOverflowOpen(false)}>
                    Keyboard shortcuts
                  </Link>

                  <div className="auth-user-dropdown-divider" />

                  {/* Group 3 — Account (M1/M12) */}
                  <Link to="/premium" className="auth-overflow-dropdown-item" onClick={() => setIsOverflowOpen(false)}>
                    Subscription
                  </Link>
                  <Link to="/settings" className="auth-overflow-dropdown-item" onClick={() => setIsOverflowOpen(false)}>
                    Settings
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsOverflowOpen(false); }}
                    className="auth-overflow-dropdown-item auth-user-dropdown-logout"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/premium" className="auth-nav-pro">
              Upgrade now
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
