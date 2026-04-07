import { Link } from 'react-router-dom'

const formatCount = (value) => {
  const numericValue = Number(value) || 0

  if (numericValue >= 1000000) {
    return `${(numericValue / 1000000).toFixed(numericValue >= 10000000 ? 0 : 1)}M`
  }

  if (numericValue >= 1000) {
    return `${Math.round(numericValue / 100) / 10}K`
  }

  return `${numericValue}`
}

function HistoryPanel({
  track,
  currentView,
  fanLeaderboard,
  relatedTracks,
  playlists,
  likers,
  reposters,
  isPlaying,
  onLikeToggle,
  onTogglePlay,
}) {
  const sidebarLinks = {
    related: `/tracks/${track.id}/related`,
    playlists: `/tracks/${track.id}/playlists`,
    likes: `/tracks/${track.id}/likes`,
    reposts: `/tracks/${track.id}/reposts`,
  }

  return (
    <aside className="sidebar-stack" id="history">
      <section className="sidebar-section">
        <div className="sidebar-section-head">
          <div>
            <h2>Fans</h2>
            <p>Listeners who played this track the most.</p>
          </div>
        </div>

        <div className="fan-list">
          {fanLeaderboard.slice(0, 5).map((fan, index) => (
            <article className="fan-row" key={fan.id}>
              <span className="fan-rank">{index + 1}</span>
              <img src={fan.avatar} alt={fan.name} />
              <div>
                <strong>{fan.name}</strong>
                <p>{fan.handle}</p>
              </div>
              <span className="fan-plays">{fan.plays} plays</span>
            </article>
          ))}
        </div>
      </section>

      <section className="sidebar-section">
        <div className="sidebar-button-row">
          <Link className="sidebar-button-link" to="/profile">
            Avatar
          </Link>
          <button type="button" onClick={onLikeToggle}>
            {track.viewerHasLiked ? 'Liked' : 'Like'}
          </button>
          <Link className="sidebar-button-link" to="/profile">
            Follow
          </Link>
          <button type="button" onClick={onTogglePlay}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </section>

      <section className="sidebar-section">
        <div className="sidebar-section-head">
          <h2>Related tracks</h2>
          <Link
            className={currentView === 'related' ? 'is-current' : ''}
            to={sidebarLinks.related}
          >
            View all
          </Link>
        </div>

        <div className="sidebar-track-list">
          {relatedTracks.slice(0, 2).map((item) => (
            <Link className="sidebar-track-row" key={item.id} to={`/tracks/${item.id}`}>
              <img src={item.cover} alt={item.title} />
              <div>
                <p>{item.artist}</p>
                <strong>{item.title}</strong>
                <span>
                  {formatCount(item.playCount)} plays · {formatCount(item.likeCount)} likes
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="sidebar-section">
        <div className="sidebar-section-head">
          <h2>In playlists</h2>
          <Link
            className={currentView === 'playlists' ? 'is-current' : ''}
            to={sidebarLinks.playlists}
          >
            View all
          </Link>
        </div>

        <div className="sidebar-playlist-list">
          {playlists.slice(0, 3).map((playlist) => (
            <Link
              className="sidebar-playlist-row"
              key={playlist.id}
              to={`/playlists/${playlist.id}`}
            >
              <img src={playlist.cover} alt={playlist.title} />
              <div>
                <p>{playlist.creatorName}</p>
                <strong>{playlist.title}</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="sidebar-section">
        <div className="sidebar-section-head">
          <h2>{formatCount(track.likeCount)} likes</h2>
          <Link
            className={currentView === 'likes' ? 'is-current' : ''}
            to={sidebarLinks.likes}
          >
            View all
          </Link>
        </div>

        <div className="avatar-cluster">
          {likers.slice(0, 8).map((user) => (
            <Link className="avatar-bubble" key={user.id} to={sidebarLinks.likes}>
              <img src={user.avatar} alt={user.name} />
            </Link>
          ))}
        </div>
      </section>

      <section className="sidebar-section">
        <div className="sidebar-section-head">
          <h2>{formatCount(track.repostCount)} reposts</h2>
          <Link
            className={currentView === 'reposts' ? 'is-current' : ''}
            to={sidebarLinks.reposts}
          >
            View all
          </Link>
        </div>

        <div className="avatar-cluster">
          {reposters.slice(0, 8).map((user) => (
            <Link className="avatar-bubble" key={user.id} to={sidebarLinks.reposts}>
              <img src={user.avatar} alt={user.name} />
            </Link>
          ))}
        </div>
      </section>
    </aside>
  )
}

export default HistoryPanel
