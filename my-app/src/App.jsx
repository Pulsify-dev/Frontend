import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import PulsifyNotificationBadge from './components/notifications/PulsifyNotificationBadge';
import DiscoveryFeedPage from './pages/DiscoveryFeedPage';
import SearchHubPage from './pages/SearchHubPage';
import TrendingChartsPage from './pages/TrendingChartsPage';
import './App.css';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="pulsify-app-layout" data-testid="app-layout">
          <nav className="pulsify-navbar">
            <h1 className="pulsify-logo">Pulsify</h1>
            
            <div className="pulsify-nav-links">
              <Link to="/" className="nav-link">Feed</Link>
              <Link to="/search" className="nav-link">Search</Link>
              <Link to="/trending" className="nav-link">Trending</Link>
            </div>
            
            <div className="pulsify-nav-actions">
              <PulsifyNotificationBadge />
            </div>
          </nav>
          
          <main className="pulsify-main-content">
            <Routes>
              <Route path="/" element={<DiscoveryFeedPage />} />
              <Route path="/search" element={<SearchHubPage />} />
              <Route path="/trending" element={<TrendingChartsPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;
