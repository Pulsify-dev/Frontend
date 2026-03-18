import { BrowserRouter, Route, Routes } from 'react-router-dom'
import TrackPage from './pages/TrackPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/trackpage" element={<TrackPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
