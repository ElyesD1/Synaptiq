import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Info } from 'lucide-react'
import { useStore } from '../store'
import { getGameMeta } from '../data/games'
import type { GameResultData } from '../types'
import type { GameId } from '../types'

import MemoryMatrix from '../games/MemoryMatrix'
import AimTraining from '../games/AimTraining'
import DigitSpan from '../games/DigitSpan'
import ReactionTime from '../games/ReactionTime'
import MentalMath from '../games/MentalMath'
import StroopTest from '../games/StroopTest'
import SequenceMemory from '../games/SequenceMemory'
import PatternRecognition from '../games/PatternRecognition'

type GameComponentType = React.ComponentType<{
  onComplete: (result: GameResultData) => void
}>

const GAME_MAP: Record<GameId, GameComponentType> = {
  'memory-matrix': MemoryMatrix,
  'aim-training': AimTraining,
  'digit-span': DigitSpan,
  'reaction-time': ReactionTime,
  'mental-math': MentalMath,
  stroop: StroopTest,
  'sequence-memory': SequenceMemory,
  'pattern-recognition': PatternRecognition,
}

export default function GamePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recordSession = useStore((s) => s.recordSession)
  const [gameKey, setGameKey] = useState(0) // increment to force remount

  const meta = getGameMeta(id ?? '')
  const GameComponent = id ? GAME_MAP[id as GameId] : null

  if (!meta || !GameComponent) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 gap-4">
        <div className="text-2xl font-bold text-gray-900">Game not found</div>
        <button onClick={() => navigate('/games')} className="text-blue-500 font-medium">
          Back to Games
        </button>
      </div>
    )
  }

  const handleComplete = (result: GameResultData) => {
    recordSession(meta.id as GameId, {
      score: result.score,
      level: result.level,
      accuracy: result.accuracy,
      reactionTime: result.reactionTime,
      duration: result.duration,
    })
    setGameKey((k) => k) // keep stable; games use internal reset
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 bg-white/90 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-50">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>

        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900">{meta.name}</div>
          <div
            className="text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-0.5"
            style={{ color: meta.color, backgroundColor: `${meta.color}18` }}
          >
            {meta.category}
          </div>
        </div>

        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center opacity-0">
          <Info size={18} />
        </div>
      </div>

      {/* Game */}
      <motion.div
        key={gameKey}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <GameComponent onComplete={handleComplete} key={gameKey} />
      </motion.div>
    </div>
  )
}
