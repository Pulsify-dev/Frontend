import HomeFeedPage from './pages/HomeFeedPage.jsx'
import './App.css'

function App() {
  // Currently rendering home feed - routing will be integrated later
  const userId = null; // Replace with actual authenticated user ID

  return (
    <div className="pulsify-app">
      <HomeFeedPage userId={userId} />
    </div>
  )
}

export default App
