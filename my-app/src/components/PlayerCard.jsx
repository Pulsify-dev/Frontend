const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function PlayerCard({
  duration,
  isPlaying,
  currentTime,
  onTogglePlay,
  onSeek,
  volume,
  onVolume,
  progress,
}) {
  return (
    <div className="player-card">
      <div className="player-row">
        <button className="play-toggle" onClick={onTogglePlay}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <div className="time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      <div className="slider-row">
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
        <span className="progress-label">{progress.toFixed(0)}%</span>
      </div>
      <div className="slider-row">
        <label htmlFor="volume">Volume</label>
        <input
          id="volume"
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(event) => onVolume(Number(event.target.value))}
        />
        <span className="progress-label">{volume}%</span>
      </div>
    </div>
  )
}

export default PlayerCard
