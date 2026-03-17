function LoadingState({ label = 'Loading track' }) {
  return (
    <main className="page">
      <section className="track-hero">
        <div className="cover skeleton" />
        <div className="track-info">
          <span className="tag">{label}</span>
          <div className="skeleton title" />
          <div className="skeleton line" />
          <div className="skeleton card" />
        </div>
      </section>
    </main>
  )
}

export default LoadingState
