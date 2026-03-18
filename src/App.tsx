import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import GamesPage from './pages/GamesPage'
import GamePage from './pages/GamePage'
import ProgressPage from './pages/ProgressPage'
import Welcome from './pages/Welcome'
import { useStore } from './store'

export default function App() {
  const hasSeenWelcome = useStore((s) => s.hasSeenWelcome)

  if (!hasSeenWelcome) return <Welcome />

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/game/:id" element={<GamePage />} />
          <Route path="/progress" element={<ProgressPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
