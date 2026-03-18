import { motion } from 'framer-motion'
import { Trophy, RotateCcw, Home, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import type { GameResultData } from '../../types'

interface GameResultProps {
  result: GameResultData
  personalBest: number
  gameId: string
  onPlayAgain: () => void
}

export default function GameResult({ result, personalBest, gameId, onPlayAgain }: GameResultProps) {
  const navigate = useNavigate()
  const isNewBest = result.score > personalBest

  return (
    <motion.div
      className="flex flex-col items-center flex-1 px-6 py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Trophy / Icon */}
      <motion.div
        className="relative mb-6"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center">
          <Trophy size={38} className="text-white" />
        </div>
        {isNewBest && (
          <motion.div
            className="absolute -top-1 -right-1 bg-amber-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
          >
            NEW BEST
          </motion.div>
        )}
      </motion.div>

      {/* Main Score */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-6xl font-black tracking-tight text-gray-900 font-mono">
          {result.score}
        </div>
        <div className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-widest">
          {result.label}
        </div>
        {result.sublabel && (
          <div className="text-sm text-gray-400 mt-0.5">{result.sublabel}</div>
        )}
      </motion.div>

      {/* Stats Row */}
      <motion.div
        className="w-full grid grid-cols-3 gap-3 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <StatCard label="Duration" value={`${result.duration}s`} />
        {result.accuracy !== undefined && (
          <StatCard label="Accuracy" value={`${result.accuracy}%`} />
        )}
        {result.reactionTime !== undefined && (
          <StatCard label="Avg RT" value={`${result.reactionTime}ms`} />
        )}
        {result.level !== undefined && (
          <StatCard label="Level" value={`${result.level}`} />
        )}
        <StatCard
          label="Personal Best"
          value={`${isNewBest ? result.score : personalBest}`}
          highlight={isNewBest}
        />
      </motion.div>

      {/* Actions */}
      <motion.div
        className="w-full flex flex-col gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Button onClick={onPlayAgain} size="lg" className="w-full">
          <RotateCcw size={18} />
          Play Again
        </Button>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => navigate('/')}
          >
            <Home size={18} />
            Home
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => navigate('/progress')}
          >
            <TrendingUp size={18} />
            Progress
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-2xl p-3 text-center ${highlight ? 'bg-amber-50' : 'bg-gray-50'}`}>
      <div className={`text-lg font-bold font-mono ${highlight ? 'text-amber-600' : 'text-gray-900'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  )
}
