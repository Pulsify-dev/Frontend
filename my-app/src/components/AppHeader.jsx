function AppHeader() {
  return (
    <header className="topbar">
      <span className="brand">
        <span className="logo-mark" aria-hidden="true" />
        SoundCloud
      </span>
      <div className="topbar-actions">
        <input
          className="search"
          type="text"
          placeholder="Search for tracks, artists, playlists"
        />
        <div className="status-pill">Playback Phase 1 - 20%</div>
      </div>
    </header>
  )
}

export default AppHeader
