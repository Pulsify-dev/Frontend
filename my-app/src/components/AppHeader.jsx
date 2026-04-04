import { Link } from 'react-router-dom'

function AppHeader() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand-cluster">
          <Link className="brand" to="/tracks/trk-2026-014">
            <span className="logo-mark" aria-hidden="true" />
            <span>Pulsify</span>
          </Link>

          <nav className="main-nav" aria-label="Primary">
            <a href="#stream">Stream</a>
            <a href="#comments">Comments</a>
            <a href="#history">History</a>
          </nav>
        </div>

        <div className="topbar-actions">
          <input
            className="search"
            type="text"
            placeholder="Search tracks, people, and playlists"
            aria-label="Search"
          />
          <Link className="header-action" to="/upload">
            Upload
          </Link>
          <Link className="profile-chip" to="/profile">
            Profile
          </Link>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
