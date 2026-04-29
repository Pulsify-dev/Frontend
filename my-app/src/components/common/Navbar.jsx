import { useState, useRef, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMessaging } from "@/hooks/useMessaging";
import { NotificationContext } from "../../context/NotificationContext";
import { PulsifyAuthVaultContext } from "../../store/PulsifyAuthVault";
import serviceLocator from "../../utils/serviceLocator";
import "../../css/navbar-soundcloud.css";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [suggestions, setSuggestions] = useState({ tracks: [], users: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isArtist, logout } = useAuth();
  const { unreadTotal } = useMessaging();
  const { subscriptionTier } = useContext(PulsifyAuthVaultContext) || {};
  const isPro = subscriptionTier === "PRO";

  // Notification context
  const { unreadCount, notifications, markAsRead, markAllRead } = useContext(
    NotificationContext,
  ) || {
    unreadCount: 0,
    notifications: [],
    markAsRead: () => {},
    markAllRead: () => {},
  };

  const userMenuRef = useRef(null);
  const overflowMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const messagesRef = useRef(null);
  const searchContainerRef = useRef(null);

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
      if (
        overflowMenuRef.current &&
        !overflowMenuRef.current.contains(event.target)
      ) {
        setIsOverflowOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target)) {
        setIsMessagesOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions({ tracks: [], users: [] });
      setShowSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const data =
          await serviceLocator.discovery.searchSuggestions(searchQuery);
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Autocomplete search error:", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setShowSuggestions(false);

    // Resource Resolver logic: If it looks like a URL, try resolving it directly
    if (
      searchQuery.includes("http://") ||
      searchQuery.includes("https://") ||
      searchQuery.includes("localhost:")
    ) {
      try {
        const resolved = await serviceLocator.discovery.resolveUrl(
          searchQuery.trim(),
        );
        if (resolved && resolved.type === "track" && resolved.id) {
          navigate(`/tracks/${resolved.id}`);
          return;
        } else if (resolved && resolved.type === "user" && resolved.id) {
          navigate(`/profile/${resolved.id}`);
          return;
        }
      } catch (err) {
        console.error("Resource Resolver failed:", err);
      }
    }

    // Otherwise fallback to global search
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleSuggestionClick = (path) => {
    setShowSuggestions(false);
    setSearchQuery("");
    navigate(path);
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

      <div
        style={{ position: "relative", flexGrow: 1, margin: "0 30px" }}
        ref={searchContainerRef}
      >
        <form
          onSubmit={handleSearch}
          className="auth-search-form"
          style={{ margin: 0 }}
        >
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim()) setShowSuggestions(true);
            }}
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

        {showSuggestions &&
          (suggestions.tracks?.length > 0 ||
            suggestions.users?.length > 0 ||
            suggestions.playlists?.length > 0 ||
            suggestions.albums?.length > 0) && (
            <div className="auth-search-suggestions">
              {/* Tracks Section */}
              {suggestions.tracks?.length > 0 && (
                <>
                  <div className="auth-suggestion-category">🎵 Tracks</div>
                  {suggestions.tracks.map((track) => (
                    <div
                      key={track.id || track._id}
                      className="auth-suggestion-item"
                      onClick={() =>
                        handleSuggestionClick(
                          `/tracks/${track.id || track._id}`,
                        )
                      }
                    >
                      <span className="auth-suggestion-icon">♪</span>
                      <div className="auth-suggestion-text">
                        <span className="auth-suggestion-primary">
                          {track.title}
                        </span>
                        <span className="auth-suggestion-secondary">
                          {track.artist_name || track.artist_username || ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* People Section */}
              {suggestions.users?.length > 0 && (
                <>
                  <div className="auth-suggestion-category">👤 People</div>
                  {suggestions.users.map((user) => (
                    <div
                      key={user.id || user._id}
                      className="auth-suggestion-item"
                      onClick={() =>
                        handleSuggestionClick(`/profile/${user._id || user.id}`)
                      }
                    >
                      <span className="auth-suggestion-icon">👤</span>
                      <div className="auth-suggestion-text">
                        <span className="auth-suggestion-primary">
                          {user.display_name || user.username}
                        </span>
                        {user.is_verified && (
                          <span className="auth-suggestion-badge">✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Playlists Section */}
              {suggestions.playlists?.length > 0 && (
                <>
                  <div className="auth-suggestion-category">📋 Playlists</div>
                  {suggestions.playlists.map((pl) => (
                    <div
                      key={pl.id || pl._id}
                      className="auth-suggestion-item"
                      onClick={() =>
                        handleSuggestionClick(`/playlists/${pl.id || pl._id}`)
                      }
                    >
                      <span className="auth-suggestion-icon">☰</span>
                      <div className="auth-suggestion-text">
                        <span className="auth-suggestion-primary">
                          {pl.title}
                        </span>
                        <span className="auth-suggestion-secondary">
                          {pl.creator_name || pl.creator_username || ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Albums Section */}
              {suggestions.albums?.length > 0 && (
                <>
                  <div className="auth-suggestion-category">💿 Albums</div>
                  {suggestions.albums.map((album) => (
                    <div
                      key={album.id || album._id}
                      className="auth-suggestion-item"
                      onClick={() =>
                        handleSuggestionClick(
                          `/albums/${album.id || album._id}`,
                        )
                      }
                    >
                      <span className="auth-suggestion-icon">💿</span>
                      <div className="auth-suggestion-text">
                        <span className="auth-suggestion-primary">
                          {album.title}
                        </span>
                        <span className="auth-suggestion-secondary">
                          {album.artist_name || album.artist_username || ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Search footer */}
              <div
                className="auth-suggestion-item auth-suggestion-search-all"
                onClick={() => {
                  setShowSuggestions(false);
                  navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                }}
              >
                <span className="auth-suggestion-icon">🔍</span>
                <span className="auth-suggestion-primary">
                  Search for "{searchQuery}"
                </span>
              </div>
            </div>
          )}
      </div>

      <div className="auth-navbar-right">
        {isAuthenticated ? (
          <>
            {isPro ? (
              <span style={{
                background: 'linear-gradient(135deg, #c9a96e, #e8d5a8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.5px',
                padding: '0 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#c9a96e"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                Artist Pro
              </span>
            ) : (
              <Link to="/premium" className="auth-nav-pro">
                Upgrade now
              </Link>
            )}

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
                <span className="auth-user-name">
                  {user?.displayName}
                  {isPro && <span className="navbar-pro-badge">PRO</span>}
                </span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`auth-user-chevron${isUserMenuOpen ? " open" : ""}`}
                >
                  <path
                    d="M20.5303 9.53033L12 18.0607L3.46967 9.53033L4.53033 8.46967L12 15.9393L19.4697 8.46967L20.5303 9.53033Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="auth-user-dropdown">
                  <Link
                    to="/profile"
                    className="auth-user-dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    Profile
                  </Link>

                  {/* Likes — Module 6 */}
                  <Link
                    to="/likes"
                    className="auth-user-dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    Likes
                  </Link>

                  {/* Playlists — Module 7 */}
                  <Link
                    to="/library?tab=playlists"
                    className="auth-user-dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 8h14v14H8z" />
                      <path d="M4 16H2V4a2 2 0 0 1 2-2h12v2H4v12z" />
                    </svg>
                    Playlists
                  </Link>

                  {/* Following — Module 3 */}
                  <Link
                    to="/following"
                    className="auth-user-dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    Following
                  </Link>

                  {/* Who to follow — Module 3 */}
                  <Link
                    to="/discover"
                    className="auth-user-dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                    Who to follow
                  </Link>

                  {/* Try Artist Pro — Module 12 (non-artists) */}
                  {!isArtist() && (
                    <Link
                      to="/premium"
                      className="auth-user-dropdown-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="12" fill="#f50" />
                        <path
                          d="M12 16.5l4.33 2.6-1.15-4.93L19 10.74l-5.04-.43L12 5.75l-1.96 4.56-5.04.43 3.82 3.43-1.15 4.93z"
                          fill="#fff"
                        />
                      </svg>
                      Try Artist Pro
                    </Link>
                  )}

                  {/* Tracks — Module 4 (artists) */}
                  {isArtist() && (
                    <Link
                      to="/my-tracks"
                      className="auth-user-dropdown-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M6 18h2V6H6v12zm4 4h2V2h-2v20zm4-16v12h2V6h-2z" />
                      </svg>
                      Tracks
                    </Link>
                  )}

                  <div className="auth-user-dropdown-divider" />

                  {/* Group 2 — Premium & Features (M12) */}
                  <Link
                    to="/premium"
                    className="auth-overflow-dropdown-item"
                    onClick={() => setIsOverflowOpen(false)}
                  >
                    Artist Membership
                  </Link>
                  <Link
                    to="/keyboard-shortcuts"
                    className="auth-overflow-dropdown-item"
                    onClick={() => setIsOverflowOpen(false)}
                  >
                    Keyboard shortcuts
                  </Link>

                  <div className="auth-user-dropdown-divider" />

                  {/* Group 3 — Account (M1/M12) */}
                  <Link
                    to="/premium"
                    className="auth-overflow-dropdown-item"
                    onClick={() => setIsOverflowOpen(false)}
                  >
                    Subscription
                  </Link>
                  <Link
                    to="/settings"
                    className="auth-overflow-dropdown-item"
                    onClick={() => setIsOverflowOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOverflowOpen(false);
                    }}
                    className="auth-overflow-dropdown-item auth-user-dropdown-logout"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Bell Notifications dropdown (Module 10) */}
            <div className="auth-notif-container" ref={notificationsRef}>
              <button
                className={`auth-nav-icon-btn${isNotificationsOpen ? " active" : ""}`}
                title="Notifications"
                onClick={() => openDropdown(setIsNotificationsOpen)}
              >
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        backgroundColor: "#f50",
                        color: "white",
                        borderRadius: "50%",
                        width: "16px",
                        height: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
              </button>

              {isNotificationsOpen && (
                <div className="auth-panel-dropdown">
                  <div className="auth-panel-dropdown-header">
                    <span className="auth-panel-dropdown-title">
                      Notifications
                    </span>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      {unreadCount > 0 && (
                        <button
                          style={{
                            background: "none",
                            border: "none",
                            color: "#999",
                            fontSize: "13px",
                            cursor: "pointer",
                            padding: 0,
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            markAllRead();
                            setIsNotificationsOpen(false);
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                      <Link
                        to="/settings"
                        className="auth-panel-dropdown-settings"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        Settings
                      </Link>
                    </div>
                  </div>
                  <div
                    className="auth-panel-dropdown-body"
                    style={{
                      maxHeight: "350px",
                      overflowY: "auto",
                      padding: 0,
                    }}
                  >
                    {!notifications || notifications.length === 0 ? (
                      <div
                        className="auth-panel-dropdown-empty"
                        style={{ padding: "30px 20px" }}
                      >
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#555"
                          strokeWidth="1.5"
                        >
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      <ul
                        style={{
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                          textAlign: "left",
                        }}
                      >
                        {notifications.slice(0, 20).map((notif) => (
                          <li
                            key={notif.id || notif._id}
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #333",
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              backgroundColor:
                                notif.is_read || notif.read
                                  ? "transparent"
                                  : "rgba(255, 85, 0, 0.1)",
                              cursor: "pointer",
                              transition: "background-color 0.2s ease",
                            }}
                            onClick={() => {
                              if (!(notif.is_read || notif.read))
                                markAsRead(notif.id || notif._id);
                            }}
                          >
                            <div 
                              style={{ flexShrink: 0, cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const actorId = notif.actorId || notif.actor_id?._id || notif.actor_id;
                                if (actorId) {
                                  setIsNotificationsOpen(false);
                                  navigate(`/profile/${actorId}`);
                                }
                              }}
                            >
                              {notif.actorAvatar ||
                              notif.actor_avatar ||
                              notif.actor_id?.avatar_url ? (
                                <img
                                  src={
                                    notif.actorAvatar ||
                                    notif.actor_avatar ||
                                    notif.actor_id?.avatar_url
                                  }
                                  alt="User"
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    backgroundColor: "#444",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#ddd",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                  }}
                                >
                                  {(notif.actorName ||
                                    notif.actor_name ||
                                    notif.actor_id?.display_name ||
                                    "U")[0].toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "14px",
                                  lineHeight: "1.4",
                                  color: "#ccc",
                                  wordWrap: "break-word",
                                }}
                              >
                                <strong style={{ color: "#fff" }}>
                                  {notif.actorName ||
                                    notif.actor_name ||
                                    notif.actor_id?.display_name ||
                                    "Someone"}
                                </strong>{" "}
                                {(() => {
                                  const type =
                                    notif.type || notif.action_type || "";
                                  switch (type.toUpperCase()) {
                                    case "LIKE":
                                      return (
                                        <span>
                                          <span style={{ color: "#ff5500" }}>
                                            ❤️
                                          </span>{" "}
                                          liked your track
                                        </span>
                                      );
                                    case "REPOST":
                                      return (
                                        <span>
                                          <span style={{ color: "#ff5500" }}>
                                            🔁
                                          </span>{" "}
                                          reposted your track
                                        </span>
                                      );
                                    case "COMMENT":
                                      return (
                                        <span>💬 commented on your track</span>
                                      );
                                    case "FOLLOW":
                                      return (
                                        <span>👤 started following you</span>
                                      );
                                    case "MESSAGE":
                                      return <span>✉️ sent you a message</span>;
                                    default:
                                      return (
                                        <span>
                                          {notif.message ||
                                            "interacted with you"}
                                        </span>
                                      );
                                  }
                                })()}{" "}
                                {notif.targetTitle && (
                                  <em
                                    style={{
                                      fontStyle: "normal",
                                      color: "#fff",
                                    }}
                                  >
                                    {notif.targetTitle}
                                  </em>
                                )}
                              </div>
                              <div
                                style={{
                                  color: "#888",
                                  fontSize: "12px",
                                  marginTop: "4px",
                                }}
                              >
                                {(() => {
                                  const date = new Date(
                                    notif.createdAt || notif.created_at,
                                  );
                                  const now = new Date();
                                  const diffMs = now - date;
                                  const diffMins = Math.floor(diffMs / 60000);
                                  const diffHours = Math.floor(diffMins / 60);
                                  const diffDays = Math.floor(diffHours / 24);

                                  if (diffMins < 60)
                                    return `${diffMins || 1}m ago`;
                                  if (diffHours < 24)
                                    return `${diffHours}h ago`;
                                  if (diffDays < 7) return `${diffDays}d ago`;
                                  return date.toLocaleDateString();
                                })()}
                              </div>
                            </div>

                            {notif.type?.toUpperCase() === "FOLLOW" && (
                              <button
                                style={{
                                  backgroundColor: "#fff",
                                  color: "#000",
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                  padding: "6px 12px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  marginLeft: "auto",
                                  flexShrink: 0,
                                }}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await serviceLocator.discovery.followUser(
                                      notif.actorId,
                                    );
                                    e.target.innerText = "Following";
                                    e.target.style.backgroundColor =
                                      "transparent";
                                    e.target.style.color = "#fff";
                                    e.target.style.border = "1px solid #555";
                                  } catch (err) {
                                    console.error("Follow failed", err);
                                  }
                                }}
                              >
                                Follow back
                              </button>
                            )}

                            {!(notif.is_read || notif.read) && (
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  backgroundColor: "#f50",
                                  flexShrink: 0,
                                  marginLeft:
                                    notif.type?.toUpperCase() === "FOLLOW"
                                      ? "12px"
                                      : "auto",
                                }}
                              ></div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Link
                    to="/notifications"
                    className="auth-panel-dropdown-footer"
                    onClick={() => setIsNotificationsOpen(false)}
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </div>

            {/* Envelope — Messages dropdown (Module 9) */}
            <div className="auth-messages-container" ref={messagesRef}>
              <button
                className={`auth-nav-icon-btn${isMessagesOpen ? " active" : ""}`}
                title="Messages"
                onClick={() => openDropdown(setIsMessagesOpen)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#555"
                        strokeWidth="1.5"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <p>No messages yet</p>
                    </div>
                  </div>
                  <Link
                    to="/messages"
                    className="auth-panel-dropdown-footer"
                    onClick={() => setIsMessagesOpen(false)}
                  >
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
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>

              {isOverflowOpen && (
                <div className="auth-overflow-dropdown">
                  {/* Group 1 — Info & Legal */}
                  <Link
                    to="/about"
                    className="auth-overflow-dropdown-item"
                    onClick={() => setIsOverflowOpen(false)}
                  >
                    About us
                  </Link>
                  <Link
                    to="/legal"
                    className="auth-overflow-dropdown-item"
                    onClick={() => setIsOverflowOpen(false)}
                  >
                    Legal
                  </Link>
                  <Link
                    to="/copyright"
                    className="auth-overflow-dropdown-item"
                    onClick={() => setIsOverflowOpen(false)}
                  >
                    Copyright
                  </Link>

                  <div className="auth-user-dropdown-divider" />

                  {/* Group 2 — Premium & Features (M12) */}
                  <Link
                    to="/premium"
                    className="auth-overflow-dropdown-item"
                    onClick={() => setIsOverflowOpen(false)}
                  >
                    Artist Membership
                  </Link>
                  <Link
                    to="/keyboard-shortcuts"
                    className="auth-overflow-dropdown-item"
                    onClick={() => setIsOverflowOpen(false)}
                  >
                    Keyboard shortcuts
                  </Link>

                  <div className="auth-user-dropdown-divider" />

                  {/* Group 3 — Account (M1/M12) */}
                  <Link
                    to="/premium"
                    className="auth-overflow-dropdown-item"
                    onClick={() => setIsOverflowOpen(false)}
                  >
                    Subscription
                  </Link>
                  <Link
                    to="/settings"
                    className="auth-overflow-dropdown-item"
                    onClick={() => setIsOverflowOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOverflowOpen(false);
                    }}
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
