import mockData from '../mock/track.json'
const API_BASE = import.meta.env.VITE_API_BASE ?? ''
const useMock = String(import.meta.env.VITE_USE_MOCK) === 'true'

export const getTrack = async () => {
  if (useMock) {
    return mockData.track
  }

  const response = await fetch(`${API_BASE}/tracks/active`)
  if (!response.ok) {
    throw new Error('Failed to load track')
  }
  return response.json()
}
