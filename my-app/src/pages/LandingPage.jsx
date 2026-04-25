import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import "./LandingPage.css";

const TRENDING = [
  { id: 1, title: "DAH", artist: "Noche", color: "#2a1a0a" },
  { id: 2, title: "do you love me?", artist: "K.ONE", color: "#0a1a2a" },
  { id: 3, title: "BBFL", artist: "GRiZ", color: "#1a1a2a" },
  { id: 4, title: "come die with me", artist: "anhero", color: "#0a1a1a" },
  { id: 5, title: "Teach You Desire", artist: "IDEMI", color: "#1a0a0a" },
  { id: 6, title: "Milzy – Mastermind", artist: "Milzy", color: "#1a1a1a" },
];

const HERO_SLIDES = [0, 1, 2];

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/discover", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((s) => (s + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  if (isLoading || isAuthenticated) return null;

  return (
    <div className="landing">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <Link to="/" className="landing-logo-link">
            <svg
              className="landing-logo-icon"
              viewBox="0 0 92 24"
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 18.5c0 2.485 1.791 4.5 4 4.5s4-2.015 4-4.5V10c0-.276-.224-.5-.5-.5s-.5.224-.5.5v8.5c0 1.93-1.346 3.5-3 3.5s-3-1.57-3-3.5V13c0-.276-.224-.5-.5-.5S0 12.724 0 13v5.5zM9 10.5c0-.276.224-.5.5-.5s.5.224.5.5V22c0 .276-.224.5-.5.5S9 22.276 9 22V10.5zM11 8.5c0-.276.224-.5.5-.5s.5.224.5.5V22c0 .276-.224.5-.5.5s-.5-.224-.5-.5V8.5zM13 6.5c0-.276.224-.5.5-.5s.5.224.5.5V22c0 .276-.224.5-.5.5s-.5-.224-.5-.5V6.5zM15 5.5c0-.276.224-.5.5-.5s.5.224.5.5V22c0 .276-.224.5-.5.5s-.5-.224-.5-.5V5.5z" />
              <text
                x="22"
                y="18"
                fontSize="14"
                fontWeight="700"
                fill="white"
                fontFamily="sans-serif"
              >
                pulsify
              </text>
            </svg>
          </Link>
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" className="landing-nav-signin">
            Sign in
          </Link>
          <Link to="/register" className="landing-nav-register">
            Create account
          </Link>
          <Link to="/premium" className="landing-nav-artists">
            For Artists
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            It all starts with
            <br />
            an upload.
          </h1>
          <p className="landing-hero-sub">
            From bedrooms and broom closets to studios and stadiums, Pulsify is
            where you define what's next in music. Just hit upload.
          </p>
          <div className="landing-hero-ctas">
            <Link to="/register" className="landing-cta-upload">
              Upload
            </Link>
            <Link to="/premium" className="landing-cta-pro">
              Explore Artist Pro
            </Link>
          </div>
          <div className="landing-hero-dots">
            {HERO_SLIDES.map((i) => (
              <button
                key={i}
                className={`landing-dot${activeSlide === i ? " landing-dot--active" : ""}`}
                onClick={() => setActiveSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="landing-hero-artist-tag">
          <span className="landing-artist-name">Rising Artist</span>
          <span className="landing-artist-label">Ascending Artist</span>
        </div>
      </section>

      {/* ── Search ── */}
      <section className="landing-search-section">
        <form className="landing-search-form" onSubmit={handleSearch}>
          <div className="landing-search-wrap">
            <svg
              className="landing-search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="landing-search-input"
              type="text"
              placeholder="Search for artists, bands, tracks, podcasts"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search"
            />
          </div>
          <span className="landing-search-or">or</span>
          <Link to="/register" className="landing-search-upload-btn">
            Upload your own
          </Link>
        </form>
      </section>

      {/* ── Trending ── */}
      <section className="landing-trending">
        <h2 className="landing-trending-title">
          Hear what's trending for free in the Pulsify community
        </h2>
        <div className="landing-trending-grid">
          {TRENDING.map((track) => (
            <Link to="/discover" key={track.id} className="landing-track-card">
              <div
                className="landing-track-artwork"
                style={{ background: track.color }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="var(--sc-orange)"
                  opacity="0.4"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <p className="landing-track-title">{track.title}</p>
              <p className="landing-track-artist">{track.artist}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
