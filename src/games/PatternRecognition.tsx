import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../components/ui/Button'
import GameResult from '../components/ui/GameResult'
import { useStore } from '../store'
import type { GameResultData } from '../types'
import { PATTERNS, type Cell, type Shape } from '../data/patterns'
import { useDemoStep } from '../hooks/useDemoStep'

const PR_DEMO_DURATIONS = [2200, 1800, 1600]
const PR_DEMO_CAPTIONS = [
  'A 3×3 grid — one cell is missing (?)',
  'Find the rule: shapes grow by 1 each row',
  '✓ Option 3 fits — 3 filled circles',
]

function PatternLogicDemo() {
  const step = useDemoStep(PR_DEMO_DURATIONS)

  // Static demo puzzle: filled circles, count increases left→right (1,2,3 per row)
  const demoGrid = [
    { count: 1 }, { count: 2 }, { count: 3 },
    { count: 1 }, { count: 2 }, { count: 3 },
    { count: 1 }, { count: 2 }, null, // missing
  ]
  const options = [{ count: 1 }, { count: 2 }, { count: 3 }, { count: 4 }]
  const correctOpt = 2 // index of count:3

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-gray-900">
      <div className="flex flex-col items-center justify-center py-5 gap-3" style={{ minHeight: 130 }}>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)', width: 120 }}>
          {demoGrid.map((cell, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg flex items-center justify-center ${
                cell === null
                  ? step === 2 ? 'bg-emerald-500' : 'bg-gray-700 border border-dashed border-gray-500'
                  : 'bg-gray-700'
              }`}
            >
              {cell === null ? (
                <span className="text-white text-xs font-bold">{step === 2 ? '✓' : '?'}</span>
              ) : (
                <div className="flex gap-0.5 flex-wrap items-center justify-center">
                  {Array.from({ length: cell.count }).map((_, j) => (
                    <div key={j} className="w-2 h-2 rounded-full bg-white" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {step >= 1 && (
          <div className="flex gap-1.5">
            {options.map((opt, i) => (
              <motion.div
                key={i}
                className={`rounded-lg flex items-center justify-center gap-0.5 ${
                  step === 2 && i === correctOpt
                    ? 'bg-emerald-500'
                    : step >= 1 && i === correctOpt
                    ? 'bg-gray-600 ring-2 ring-emerald-400'
                    : 'bg-gray-700'
                }`}
                style={{ width: 28, height: 28 }}
                animate={step >= 1 && i === correctOpt ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {Array.from({ length: opt.count }).map((_, j) => (
                  <div key={j} className="w-1.5 h-1.5 rounded-full bg-white" />
                ))}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <div className="px-4 py-2 bg-gray-800 text-center">
        <p className="text-xs text-gray-300 font-medium">{PR_DEMO_CAPTIONS[step]}</p>
        <div className="flex gap-1 justify-center mt-1.5">
          {PR_DEMO_DURATIONS.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === step ? 'w-3 h-1.5 bg-slate-400' : 'w-1.5 h-1.5 bg-gray-600'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface Props {
  onComplete: (result: GameResultData) => void
}

function ShapeIcon({ shape, fill, count, size = 16 }: Cell & { size?: number }) {
  const elements = Array.from({ length: count })

  const renderShape = (key: number) => {
    const s = size * 0.75
    const filled = fill === 'filled'
    const cls = filled ? 'bg-gray-800' : 'bg-transparent border-2 border-gray-800'

    if (shape === 'circle') {
      return <div key={key} className={`rounded-full ${cls}`} style={{ width: s, height: s }} />
    }
    if (shape === 'square') {
      return <div key={key} className={`rounded-sm ${cls}`} style={{ width: s, height: s }} />
    }
    if (shape === 'triangle') {
      const color = filled ? '#1F2937' : 'transparent'
      const border = filled ? 'transparent' : '#1F2937'
      return (
        <div
          key={key}
          style={{
            width: 0,
            height: 0,
            borderLeft: `${s / 2}px solid transparent`,
            borderRight: `${s / 2}px solid transparent`,
            borderBottom: `${s}px solid ${filled ? color : border}`,
          }}
        />
      )
    }
    if (shape === 'diamond') {
      return (
        <div
          key={key}
          className={cls}
          style={{
            width: s * 0.8,
            height: s * 0.8,
            transform: 'rotate(45deg)',
            flexShrink: 0,
          }}
        />
      )
    }
    return null
  }

  return (
    <div className="flex items-center justify-center gap-0.5 flex-wrap">
      {elements.map((_, i) => renderShape(i))}
    </div>
  )
}

function PatternCell({ cell, highlight }: { cell: Cell | null; highlight?: boolean }) {
  return (
    <div
      className={`aspect-square rounded-xl flex items-center justify-center border transition-colors ${
        cell === null
          ? 'bg-gray-900 border-gray-900'
          : highlight
          ? 'bg-blue-50 border-blue-200'
          : 'bg-white border-gray-100'
      }`}
    >
      {cell !== null && <ShapeIcon {...cell} size={14} />}
      {cell === null && <span className="text-gray-400 text-lg font-bold">?</span>}
    </div>
  )
}

export default function PatternRecognition({ onComplete }: Props) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro')
  const [puzzleIdx, setPuzzleIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [result, setResult] = useState<GameResultData | null>(null)
  const [startTime] = useState(Date.now())
  const personalBest = useStore((s) => s.getGameStats('pattern-recognition').personalBest)
  const shuffledPatterns = useState(() => [...PATTERNS].sort(() => Math.random() - 0.5).slice(0, 10))[0]

  const puzzle = shuffledPatterns[puzzleIdx]

  const handleAnswer = (optionIdx: number) => {
    if (answered) return
    setSelected(optionIdx)
    setAnswered(true)
    if (optionIdx === puzzle.correct) {
      setScore((s) => s + 1)
    }
    setTimeout(() => {
      const next = puzzleIdx + 1
      if (next >= shuffledPatterns.length) {
        const finalScore = optionIdx === puzzle.correct ? score + 1 : score
        const duration = Math.round((Date.now() - startTime) / 1000)
        const r: GameResultData = {
          score: finalScore,
          accuracy: Math.round((finalScore / shuffledPatterns.length) * 100),
          duration,
          label: `Score / ${shuffledPatterns.length}`,
          sublabel: `${finalScore} correct out of ${shuffledPatterns.length}`,
        }
        setResult(r)
        onComplete(r)
        setPhase('done')
      } else {
        setPuzzleIdx(next)
        setSelected(null)
        setAnswered(false)
      }
    }, 900)
  }

  const reset = () => {
    setPhase('intro')
    setPuzzleIdx(0)
    setScore(0)
    setSelected(null)
    setAnswered(false)
    setResult(null)
  }

  if (phase === 'done' && result) {
    return <GameResult result={result} personalBest={personalBest} gameId="pattern-recognition" onPlayAgain={reset} />
  }

  if (phase === 'intro') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[80vh] px-6 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <div className="grid grid-cols-3 gap-1">
              {[0,1,2,3,4,5,6,7].map((i) => (
                <div key={i} className={`w-4 h-4 rounded-sm ${i % 3 === 0 ? 'bg-slate-800' : 'bg-slate-200'}`} />
              ))}
              <div className="w-4 h-4 rounded-sm border-2 border-slate-800 border-dashed" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Pattern Logic</h2>
          <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto leading-relaxed">
            Find the rule governing the 3×3 matrix and identify the missing piece from 4 options.
          </p>
        </div>
        <PatternLogicDemo />

        <div className="w-full space-y-3 text-sm">
          {[
            ['🧩', '10 visual reasoning puzzles'],
            ['📐', 'Rules involve count, shape, fill patterns'],
            ['⏱', 'No time limit — think carefully'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm">
              <span className="text-xl">{icon}</span>
              <span className="text-gray-600">{text}</span>
            </div>
          ))}
        </div>
        <Button size="xl" className="w-full" onClick={() => setPhase('playing')}>
          Start Puzzles
        </Button>
      </motion.div>
    )
  }

  const progress = (puzzleIdx / shuffledPatterns.length) * 100
  const difficultyColor = {
    easy: 'text-emerald-600 bg-emerald-50',
    medium: 'text-amber-600 bg-amber-50',
    hard: 'text-red-600 bg-red-50',
  }[puzzle.difficulty]

  return (
    <div className="flex flex-col px-4 pt-6 gap-5 min-h-[80vh]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
            {puzzleIdx + 1}/{shuffledPatterns.length}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${difficultyColor}`}>
            {puzzle.difficulty}
          </span>
        </div>
        <span className="text-sm font-mono text-gray-600 font-semibold">
          {score}/{puzzleIdx}
        </span>
      </div>

      {/* Progress */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-slate-500 rounded-full"
          animate={{ width: `${progress}%` }}
        />
      </div>

      {/* Matrix */}
      <AnimatePresence mode="wait">
        <motion.div
          key={puzzleIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="grid gap-2 mx-auto"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: '240px' }}
          >
            {[...puzzle.cells, null].map((cell, i) => (
              <PatternCell key={i} cell={cell} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="text-sm text-gray-400 text-center font-medium">
        Which option completes the pattern?
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {puzzle.options.map((option, i) => {
          const isCorrect = i === puzzle.correct
          const isSelected = selected === i
          const showFeedback = answered

          return (
            <motion.button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={answered}
              className={`aspect-square rounded-2xl flex items-center justify-center border-2 transition-all active:scale-95 ${
                showFeedback
                  ? isCorrect
                    ? 'bg-emerald-50 border-emerald-400'
                    : isSelected && !isCorrect
                    ? 'bg-red-50 border-red-400'
                    : 'bg-white border-gray-100 opacity-50'
                  : 'bg-white border-gray-100 hover:border-gray-300'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex flex-col items-center gap-1.5">
                <ShapeIcon {...option} size={18} />
                <span className="text-xs font-bold text-gray-400">{i + 1}</span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {answered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-gray-400 text-center px-4 italic"
        >
          {puzzle.rule}
        </motion.div>
      )}
    </div>
  )
}
