const formatPlayedAt = (value) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function HistoryPanel({ track, recentlyPlayed, listeningHistory, playbackState }) {
  return (
    <aside className="sidebar-stack" id="history">
      <section className="module-card sidebar-card">
        <div className="section-heading">
          <div>
            <h2>Playback Access</h2>
            <p>Module 5 gating copied from the provided API contract.</p>
          </div>
        </div>

        <div className="info-grid">
          <div>
            <span className="info-label">State</span>
            <strong>{playbackState}</strong>
          </div>
          <div>
            <span className="info-label">Duration</span>
            <strong>{formatTime(track.duration)}</strong>
          </div>
          <div>
            <span className="info-label">Genre</span>
            <strong>{track.genre}</strong>
          </div>
          <div>
            <span className="info-label">Location</span>
            <strong>{track.location}</strong>
          </div>
        </div>
      </section>

      <section className="module-card sidebar-card">
        <div className="section-heading">
          <div>
            <h2>Recently Played</h2>
            <p>Backed by `GET /users/me/recently-played`.</p>
          </div>
        </div>

        <div className="mini-list">
          {recentlyPlayed.map((item) => (
            <article className="mini-track" key={`${item.id}-${item.played_at}`}>
              <img src={item.cover} alt={item.title} />
              <div>
                <strong>{item.title}</strong>
                <p>{item.artist}</p>
                <span>{formatPlayedAt(item.played_at)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="module-card sidebar-card">
        <div className="section-heading">
          <div>
            <h2>Listening History</h2>
            <p>Backed by `GET /users/me/history` and updated after play events.</p>
          </div>
        </div>

        <div className="history-list">
          {listeningHistory.map((item) => (
            <article className="history-row" key={`${item.id}-${item.played_at}`}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.artist}</p>
              </div>
              <div className="history-meta">
                <span>{formatPlayedAt(item.played_at)}</span>
                <span>{Math.round((item.duration_played_ms ?? 0) / 1000)}s played</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </aside>
  )
}

export default HistoryPanel
