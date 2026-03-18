import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import GamesPage from './pages/GamesPage'
import GamePage from './pages/GamePage'
import ProgressPage from './pages/ProgressPage'

export default function App() {
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
