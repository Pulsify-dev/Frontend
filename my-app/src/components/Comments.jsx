import { useState } from 'react'

function Comments({ currentTime }) {
  const [text, setText] = useState('')
  const [comments, setComments] = useState([])

  const addComment = () => {
    if (!text.trim()) return

    const newComment = {
      id: Date.now(),
      text,
      time: currentTime,
    }

    setComments([...comments, newComment])
    setText('')
  }

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Comments</h3>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write comment..."
      />
      <button onClick={addComment}>Add</button>

      {comments.map((c) => (
        <div key={c.id}>
          <p>{c.text}</p>
          <span>{formatTime(c.time)}</span>
        </div>
      ))}
    </div>
  )
}

export default Comments