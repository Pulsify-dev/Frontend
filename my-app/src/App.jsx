import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { PlayerProvider } from './context/PlayerContext';
import PulsifyNotificationBadge from './components/notifications/PulsifyNotificationBadge';
import PulsifyPlayerBar from './components/common/PulsifyPlayerBar';
import DiscoveryFeedPage from './pages/DiscoveryFeedPage';
import SearchHubPage from './pages/SearchHubPage';
import TrendingChartsPage from './pages/TrendingChartsPage';
import './App.css';

// Inner component so useLocation works within Router
const AppShell = () => {
  const location = useLocation();
  const [navSearch, setNavSearch] = useState('');

  const isActive = (path) => location.pathname === path ? 'sc-nav-link active' : 'sc-nav-link';

  return (
    <div className="sc-app" data-testid="app-layout">
      {/* SoundCloud-style Top Navigation */}
      <nav className="sc-navbar" data-testid="navbar">
        <div className="sc-navbar-inner">
          <div className="sc-nav-left">
            <Link to="/" className="sc-logo" title="Home">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="1" y="14" width="2" height="8" rx="1"/>
                <rect x="5" y="10" width="2" height="12" rx="1"/>
                <rect x="9" y="6" width="2" height="16" rx="1"/>
                <rect x="13" y="2" width="2" height="20" rx="1"/>
                <rect x="17" y="8" width="2" height="14" rx="1"/>
                <rect x="21" y="12" width="2" height="10" rx="1"/>
              </svg>
              <span>PULSIFY</span>
            </Link>
            <Link to="/" className={isActive('/')}>Home</Link>
            <Link to="/" className={isActive('/feed')}>Feed</Link>
            <Link to="/search" className={isActive('/search')}>Search</Link>
          </div>

          <div className="sc-nav-center">
            <div className="sc-nav-search-wrapper">
              <input
                type="text"
                className="sc-nav-search"
                placeholder="Search for artists, bands, tracks"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && navSearch.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(navSearch)}`;
                  }
                }}
              />
              <span className="sc-nav-search-icon">🔍</span>
            </div>
          </div>

          <div className="sc-nav-right">
            <Link to="/trending" className="sc-nav-link sc-nav-upgrade">Trending</Link>
            <PulsifyNotificationBadge />
            <div className="sc-nav-avatar">
              <div className="sc-avatar-circle" title="Profile">A</div>
            </div>
            <button className="sc-nav-dots" title="More">⋯</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="sc-main">
        <Routes>
          <Route path="/" element={<DiscoveryFeedPage />} />
          <Route path="/search" element={<SearchHubPage />} />
          <Route path="/trending" element={<TrendingChartsPage />} />
        </Routes>
      </main>

      {/* Global Player */}
      <PulsifyPlayerBar />
    </div>
  );
};

function App() {
  return (
    <NotificationProvider>
      <PlayerProvider>
        <Router>
          <AppShell />
        </Router>
      </PlayerProvider>
    </NotificationProvider>
  );
}

export default App;
