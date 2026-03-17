import { useState } from 'react'

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function EngagementPanel({
  likes,
  reposts,
  plays,
  liked,
  reposted,
  onToggleLike,
  onToggleRepost,
  comments,
  onAddComment,
  currentTime,
}) {
  const [text, setText] = useState('')
  const [timestamp, setTimestamp] = useState(currentTime)

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAddComment({
      id: `c-${Date.now()}`,
      user: 'You',
      time: Number(timestamp),
      text: trimmed,
    })
    setText('')
  }

  return (
    <section className="engagement">
      <div className="engagement-bar">
        <button
          className={`engage-btn ${liked ? 'active' : ''}`}
          onClick={onToggleLike}
        >
          Like
          <span>{likes.toLocaleString('en-US')}</span>
        </button>
        <button
          className={`engage-btn ${reposted ? 'active' : ''}`}
          onClick={onToggleRepost}
        >
          Repost
          <span>{reposts.toLocaleString('en-US')}</span>
        </button>
        <div className="engage-stat">
          Plays
          <span>{plays.toLocaleString('en-US')}</span>
        </div>
      </div>

      <div className="comments">
        <div className="comments-header">
          <h2>Comments</h2>
          <span>{comments.length} total</span>
        </div>

        <form className="comment-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Add a comment..."
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <input
            type="number"
            min="0"
            value={timestamp}
            onChange={(event) => setTimestamp(event.target.value)}
          />
          <button type="submit">Post</button>
        </form>

        <ul className="comment-list">
          {comments.map((comment) => (
            <li key={comment.id}>
              <div className="comment-meta">
                <strong>{comment.user}</strong>
                <span>{formatTime(comment.time)}</span>
              </div>
              <p>{comment.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default EngagementPanel
