import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SoundCloudLogo from "@/components/common/SoundCloudLogo";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Feed", path: "/feed" },
    { name: "Library", path: "/playlists" },
    { name: "Trending", path: "/trending" },
    { name: "Discover", path: "/discover" },
  ];

  const isActiveLink = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="auth-navbar">
      <div className="auth-navbar-left">
        <SoundCloudLogo />
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

        <Link to="/premium" className="auth-nav-pro">
          Try Artist Pro
        </Link>
        <Link to="/upload" className="auth-nav-upload">
          Upload
        </Link>
        <Link to="/profile" className="auth-nav-profile">
          Profile
        </Link>
        <Link to="/login" className="auth-nav-signin">
          Sign in
        </Link>
        <Link to="/register" className="auth-nav-register">
          Create account
        </Link>

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
          <Link
            to="/upload"
            onClick={() => setIsMobileMenuOpen(false)}
            className="auth-mobile-link"
          >
            Upload
          </Link>
          <Link
            to="/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className="auth-mobile-link"
          >
            Profile
          </Link>
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
        </div>
      )}
    </nav>
  );
};

export default Navbar;
