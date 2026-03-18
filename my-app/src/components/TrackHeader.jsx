function TrackHeader({ track }) {
  return (
    <section className="track-hero">
      <div className="cover">
        <img src={track.cover} alt={track.title} />
      </div>

      <div className="track-info">
        <span className="tag">Track Details</span>
        <h1>{track.title}</h1>
        <p className="artist">by {track.artist}</p>
      </div>
    </section>
  )
}

export default TrackHeader
