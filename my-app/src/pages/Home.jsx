import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArtistOnly, AuthenticatedOnly, GuestOnly } from "@/components/auth";

/**
 * Home Page
 * Landing page for authenticated users
 */
const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">
          <AuthenticatedOnly>
            Welcome back, {user?.displayName || "User"}!
          </AuthenticatedOnly>
          <GuestOnly>
            Discover music you'll love
          </GuestOnly>
        </h1>
        <p className="home-subtitle">
          <AuthenticatedOnly>
            Here's what's trending in your feed
          </AuthenticatedOnly>
          <GuestOnly>
            Stream millions of tracks and playlists
          </GuestOnly>
        </p>

        <GuestOnly>
          <div className="home-cta">
            <Link to="/register" className="home-btn home-btn--primary">
              Sign up free
            </Link>
            <Link to="/login" className="home-btn home-btn--secondary">
              Sign in
            </Link>
          </div>
        </GuestOnly>

        <ArtistOnly>
          <div className="home-artist-tools">
            <h3>Artist Tools</h3>
            <div className="home-artist-actions">
              <Link to="/upload" className="home-btn home-btn--primary">
                Upload Track
              </Link>
              <Link to="/stats" className="home-btn home-btn--secondary">
                View Stats
              </Link>
            </div>
          </div>
        </ArtistOnly>
      </div>

      <section className="home-section">
        <h2>Trending Now</h2>
        <p className="home-placeholder">Track listings will appear here...</p>
      </section>
    </div>
  );
};

export default Home;
