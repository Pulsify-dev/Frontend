function TrackHeader({ track, plays, likes, reposts }) {
  return (
    <section className="track-hero">
      <div className="cover">
        <img src={track.cover} alt={track.title} />
      </div>

      <div className="track-info">
        <span className="tag">Track Details</span>
        <h1>{track.title}</h1>
        <p className="artist">by {track.artist}</p>

        <div className="stats">
          <div>
            <span className="stat-label">Plays</span>
            <span className="stat-value">
              {plays.toLocaleString('en-US')}
            </span>
          </div>

          <div>
            <span className="stat-label">Likes</span>
            <span className="stat-value">
              {likes.toLocaleString('en-US')}
            </span>
          </div>

          <div>
            <span className="stat-label">Reposts</span>
            <span className="stat-value">
              {reposts.toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TrackHeader
