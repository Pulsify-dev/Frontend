const formatCount = (value) => new Intl.NumberFormat('en-US').format(value ?? 0)

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const stateCopy = {
  Playable: 'Full stream available now',
  Preview: 'Preview mode only',
  Blocked: 'Playback blocked',
}

function TrackHeader({
  track,
  isPlaying,
  onTogglePlay,
  playbackState,
  previewDurationSeconds,
}) {
  return (
    <section className="hero-card">
      <div className="hero-copy">
        <div className="hero-pills">
          <span className="tag">Playback & Social</span>
          <span className={`state-pill state-${playbackState.toLowerCase()}`}>
            {stateCopy[playbackState] ?? playbackState}
          </span>
        </div>

        <div className="hero-title-row">
          <button
            className="hero-play"
            type="button"
            onClick={onTogglePlay}
            disabled={playbackState === 'Blocked'}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <div>
            <h1>{track.title}</h1>
            <div className="hero-meta">
              <img
                className="artist-avatar"
                src={track.artistAvatar}
                alt={track.artist}
              />
              <div>
                <p className="artist-line">{track.artist}</p>
                <p className="subline">
                  {track.artistHandle} • {track.genre} • {track.location}
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="hero-description">{track.description}</p>

        <div className="hero-stats">
          <span>{formatCount(track.playCount)} plays</span>
          <span>{formatCount(track.likeCount)} likes</span>
          <span>{formatCount(track.repostCount)} reposts</span>
          <span>{track.commentCount} comments</span>
          <span>Posted {formatDate(track.postedAt)}</span>
        </div>

        {playbackState === 'Preview' ? (
          <p className="hero-note">
            Preview stops after {Math.floor(previewDurationSeconds)} seconds based
            on listener access.
          </p>
        ) : null}

        {playbackState === 'Blocked' ? (
          <p className="hero-note hero-note-warning">
            This track is currently blocked because of region or subscription
            access rules.
          </p>
        ) : null}
      </div>

      <div className="hero-artwork">
        <img src={track.cover} alt={track.title} />
      </div>
    </section>
  )
}

export default TrackHeader
