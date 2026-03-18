import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import Button from '../components/ui/Button'
import GameResult from '../components/ui/GameResult'
import { useStore } from '../store'
import type { GameResultData } from '../types'
import { useDemoStep } from '../hooks/useDemoStep'

// Demo: memorize → recall → correct
const DEMO_LIT = [0, 2, 7] // which of 9 cells are lit
const DEMO_DURATIONS = [2000, 1800, 1800, 1200]
const DEMO_CAPTIONS = [
  'The grid lights up — memorize the highlighted tiles',
  'Grid hides — now recall which tiles were lit',
  'Tap the correct tiles from memory',
  '✓ Perfect round! Level up',
]

function MemoryMatrixDemo() {
  const step = useDemoStep(DEMO_DURATIONS)
  // step 0: memorize  step 1: blank  step 2: tap  step 3: correct
  const tapped = step >= 2 ? new Set(DEMO_LIT) : new Set<number>()

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-gray-900">
      <div className="flex flex-col items-center justify-center py-6 gap-3">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)', width: 132 }}
        >
          {Array.from({ length: 9 }).map((_, i) => {
            const isLit = DEMO_LIT.includes(i)
            const isTapped = tapped.has(i)
            let bg = 'bg-gray-700'
            if (step === 0 && isLit) bg = 'bg-indigo-400'
            if (step >= 2 && isTapped) bg = step === 3 ? 'bg-emerald-400' : 'bg-indigo-400'
            return (
              <motion.div
                key={i}
                className={`rounded-xl aspect-square transition-colors duration-300 ${bg}`}
                animate={step === 3 && isLit ? { scale: [1, 1.1, 1] } : {}}
                transition={{ delay: i * 0.05 }}
              />
            )
          })}
        </div>
        {step === 1 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-indigo-300 font-semibold uppercase tracking-widest"
          >
            Recall phase
          </motion.p>
        )}
        {step === 3 && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xs text-emerald-400 font-bold"
          >
            ✓ All correct!
          </motion.p>
        )}
      </div>
      <div className="px-4 py-2 bg-gray-800 text-center">
        <p className="text-xs text-gray-300 font-medium">{DEMO_CAPTIONS[step]}</p>
        <div className="flex gap-1 justify-center mt-1.5">
          {DEMO_DURATIONS.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === step ? 'w-3 h-1.5 bg-indigo-400' : 'w-1.5 h-1.5 bg-gray-600'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface Props {
  onComplete: (result: GameResultData) => void
}

const LEVEL_CONFIG = [
  { gridSize: 3, tileCount: 3 },
  { gridSize: 3, tileCount: 4 },
  { gridSize: 3, tileCount: 5 },
  { gridSize: 4, tileCount: 5 },
  { gridSize: 4, tileCount: 7 },
  { gridSize: 4, tileCount: 9 },
  { gridSize: 5, tileCount: 9 },
  { gridSize: 5, tileCount: 12 },
  { gridSize: 5, tileCount: 15 },
  { gridSize: 6, tileCount: 15 },
]

type Phase = 'ready' | 'memorize' | 'recall' | 'feedback' | 'gameover'

export default function MemoryMatrix({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [level, setLevel] = useState(0)
  const [lives, setLives] = useState(3)
  const [target, setTarget] = useState<Set<number>>(new Set())
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [feedback, setFeedback] = useState<Map<number, 'correct' | 'wrong' | 'missed'>>(new Map())
  const [memorizeCountdown, setMemorizeCountdown] = useState(3)
  const [startTime] = useState(Date.now())
  const [result, setResult] = useState<GameResultData | null>(null)
  const personalBest = useStore((s) => s.getGameStats('memory-matrix').personalBest)

  const config = LEVEL_CONFIG[Math.min(level, LEVEL_CONFIG.length - 1)]
  const totalCells = config.gridSize * config.gridSize

  const generateLevel = useCallback((lvl: number) => {
    const cfg = LEVEL_CONFIG[Math.min(lvl, LEVEL_CONFIG.length - 1)]
    const cells = cfg.gridSize * cfg.gridSize
    const shuffled = Array.from({ length: cells }, (_, i) => i).sort(() => Math.random() - 0.5)
    return new Set(shuffled.slice(0, cfg.tileCount))
  }, [])

  const startLevel = useCallback(
    (lvl: number) => {
      const newTarget = generateLevel(lvl)
      setTarget(newTarget)
      setSelected(new Set())
      setFeedback(new Map())
      setMemorizeCountdown(3)
      setPhase('memorize')
    },
    [generateLevel],
  )

  // Memorize countdown
  useEffect(() => {
    if (phase !== 'memorize') return
    if (memorizeCountdown <= 0) {
      setPhase('recall')
      return
    }
    const t = setTimeout(() => setMemorizeCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, memorizeCountdown])

  const handleTileClick = (idx: number) => {
    if (phase !== 'recall') return
    const next = new Set(selected)
    // Toggle: second tap deselects the tile
    if (next.has(idx)) {
      next.delete(idx)
      setSelected(next)
      return
    }
    next.add(idx)
    setSelected(next)

    if (next.size === config.tileCount) {
      // Check answers
      const fb = new Map<number, 'correct' | 'wrong' | 'missed'>()
      next.forEach((i) => fb.set(i, target.has(i) ? 'correct' : 'wrong'))
      target.forEach((i) => { if (!next.has(i)) fb.set(i, 'missed') })
      setFeedback(fb)
      setPhase('feedback')

      const allCorrect = [...next].every((i) => target.has(i))
      if (allCorrect) {
        setTimeout(() => {
          const nextLevel = level + 1
          if (nextLevel >= LEVEL_CONFIG.length) {
            endGame(nextLevel)
          } else {
            setLevel(nextLevel)
            startLevel(nextLevel)
          }
        }, 1200)
      } else {
        const newLives = lives - 1
        setLives(newLives)
        if (newLives <= 0) {
          setTimeout(() => endGame(level), 1200)
        } else {
          setTimeout(() => startLevel(level), 1400)
        }
      }
    }
  }

  const endGame = (finalLevel: number) => {
    const duration = Math.round((Date.now() - startTime) / 1000)
    const r: GameResultData = {
      score: finalLevel + 1,
      level: finalLevel + 1,
      duration,
      label: 'Level Reached',
    }
    setResult(r)
    onComplete(r)
    setPhase('gameover')
  }

  const reset = () => {
    setLevel(0)
    setLives(3)
    setSelected(new Set())
    setFeedback(new Map())
    setTarget(new Set())
    setResult(null)
    setPhase('ready')
  }

  const getTileStyle = (idx: number) => {
    if (phase === 'memorize') {
      return target.has(idx) ? 'bg-gray-900 scale-95' : 'bg-gray-100'
    }
    if (phase === 'feedback') {
      const fb = feedback.get(idx)
      if (fb === 'correct') return 'bg-emerald-500 scale-95'
      if (fb === 'wrong') return 'bg-red-400 scale-95'
      if (fb === 'missed') return 'bg-amber-400 scale-95'
    }
    if (phase === 'recall') {
      return selected.has(idx) ? 'bg-gray-900 scale-95' : 'bg-gray-100 active:bg-gray-200'
    }
    return 'bg-gray-100'
  }

  if (phase === 'gameover' && result) {
    return (
      <GameResult
        result={result}
        personalBest={personalBest}
        gameId="memory-matrix"
        onPlayAgain={reset}
      />
    )
  }

  if (phase === 'ready') {
    return (
      <motion.div
        className="flex flex-col items-center flex-1 px-6 py-8 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <div className="grid grid-cols-3 gap-0.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm ${[0, 2, 4, 6, 8].includes(i) ? 'bg-indigo-600' : 'bg-indigo-200'}`}
                />
              ))}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Memory Matrix</h2>
          <p className="text-gray-500 mt-2 leading-relaxed text-sm max-w-xs mx-auto">
            A grid will light up briefly. Memorize the highlighted cells, then tap them from memory.
          </p>
        </div>

        <MemoryMatrixDemo />

        <div className="w-full space-y-3 text-sm">
          {[
            ['⊞', '3 lives to use across all levels'],
            ['⏱', 'Grid is shown for 3 seconds'],
            ['↑', 'Grid grows larger as you advance'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm">
              <span className="text-xl">{icon}</span>
              <span className="text-gray-600">{text}</span>
            </div>
          ))}
        </div>
        <Button size="xl" className="w-full" onClick={() => startLevel(0)}>
          Start Training
        </Button>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col items-center px-4 pt-6 gap-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
          Level {level + 1}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              size={18}
              className={i < lives ? 'text-red-500 fill-red-500' : 'text-gray-200 fill-gray-200'}
            />
          ))}
        </div>
      </div>

      {/* Phase label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-center"
        >
          {phase === 'memorize' && (
            <div>
              <div className="text-2xl font-bold text-gray-900">Memorize</div>
              <div className="text-gray-400 text-sm mt-0.5">
                Hiding in {memorizeCountdown}s…
              </div>
            </div>
          )}
          {phase === 'recall' && (
            <div>
              <div className="text-2xl font-bold text-gray-900">Recall</div>
              <div className="text-gray-400 text-sm mt-0.5">
                Tap {config.tileCount - selected.size} more{' '}
                {config.tileCount - selected.size === 1 ? 'tile' : 'tiles'}
              </div>
            </div>
          )}
          {phase === 'feedback' && (
            <div className="text-2xl font-bold text-gray-900">
              {[...selected].every((i) => target.has(i)) ? '✓ Perfect!' : '✗ Try Again'}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Grid */}
      <motion.div
        className="w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`,
          gap: config.gridSize >= 5 ? '6px' : '8px',
          maxWidth: '360px',
          margin: '0 auto',
        }}
      >
        {Array.from({ length: totalCells }).map((_, idx) => (
          <motion.button
            key={`${level}-${idx}`}
            className={`rounded-xl aspect-square transition-all duration-200 ${getTileStyle(idx)}`}
            onClick={() => handleTileClick(idx)}
            whileTap={{ scale: 0.92 }}
          />
        ))}
      </motion.div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {LEVEL_CONFIG.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all ${
              i === level
                ? 'w-4 h-2 bg-gray-900'
                : i < level
                ? 'w-2 h-2 bg-gray-400'
                : 'w-2 h-2 bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
