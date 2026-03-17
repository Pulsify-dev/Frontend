const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function StickyPlayer({
  track,
  duration,
  isPlaying,
  currentTime,
  onTogglePlay,
  onSeek,
}) {
  return (
    <footer className="sticky-player">
      <div className="sticky-track">
        <img src={track.cover} alt={track.title} />
        <div>
          <p className="title">{track.title}</p>
          <span>{track.artist}</span>
        </div>
      </div>
      <div className="sticky-controls">
        <button className="play-toggle" onClick={onTogglePlay}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <div className="mini-bar">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(event) => onSeek(Number(event.target.value))}
          />
          <span>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </footer>
  )
}

export default StickyPlayer
