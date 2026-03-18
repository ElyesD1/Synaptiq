import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../components/ui/Button'
import GameResult from '../components/ui/GameResult'
import { useStore } from '../store'
import type { GameResultData } from '../types'
import { Delete } from 'lucide-react'
import { useTimer } from '../hooks/useTimer'
import { useDemoStep } from '../hooks/useDemoStep'

const MM_DEMO_DURATIONS = [2000, 1500, 1200]
const MM_DEMO_CAPTIONS = ['A problem appears — solve it in your head', 'Type the answer on the keypad', '✓ Correct! Next problem immediately']

function MentalMathDemo() {
  const step = useDemoStep(MM_DEMO_DURATIONS)

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-gray-900">
      <div className="flex flex-col items-center justify-center py-7 gap-3" style={{ minHeight: 130 }}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="problem" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-4xl font-black font-mono text-white"
            >
              37 + 24
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="answer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="text-4xl font-black font-mono text-white">37 + 24</div>
              <div className="text-2xl font-bold font-mono text-emerald-300 border border-emerald-500 rounded-xl px-4 py-1">61</div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="correct" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="text-2xl font-bold font-mono text-emerald-400">✓ Correct!</div>
              <div className="text-xs text-gray-400">Score +1 · Next problem…</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="px-4 py-2 bg-gray-800 text-center">
        <p className="text-xs text-gray-300 font-medium">{MM_DEMO_CAPTIONS[step]}</p>
        <div className="flex gap-1 justify-center mt-1.5">
          {MM_DEMO_DURATIONS.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === step ? 'w-3 h-1.5 bg-emerald-400' : 'w-1.5 h-1.5 bg-gray-600'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface Props {
  onComplete: (result: GameResultData) => void
}

interface Problem {
  a: number
  b: number
  op: '+' | '-' | '×'
  answer: number
  display: string
}

function genProblem(score: number): Problem {
  const level = Math.floor(score / 5)
  let a: number, b: number, op: '+' | '-' | '×', answer: number

  if (level < 3) {
    a = Math.floor(Math.random() * 20) + 1
    b = Math.floor(Math.random() * 20) + 1
    op = '+'
    answer = a + b
  } else if (level < 7) {
    op = Math.random() < 0.5 ? '+' : '-'
    if (op === '+') {
      a = Math.floor(Math.random() * 50) + 10
      b = Math.floor(Math.random() * 50) + 10
      answer = a + b
    } else {
      a = Math.floor(Math.random() * 50) + 30
      b = Math.floor(Math.random() * a)
      answer = a - b
    }
  } else if (level < 12) {
    op = Math.random() < 0.4 ? '×' : Math.random() < 0.5 ? '+' : '-'
    if (op === '×') {
      a = Math.floor(Math.random() * 9) + 2
      b = Math.floor(Math.random() * 9) + 2
      answer = a * b
    } else if (op === '+') {
      a = Math.floor(Math.random() * 99) + 10
      b = Math.floor(Math.random() * 99) + 10
      answer = a + b
    } else {
      a = Math.floor(Math.random() * 99) + 50
      b = Math.floor(Math.random() * 49)
      answer = a - b
    }
  } else {
    op = '×'
    a = Math.floor(Math.random() * 20) + 5
    b = Math.floor(Math.random() * 20) + 5
    answer = a * b
  }

  return { a, b, op, answer, display: `${a} ${op} ${b}` }
}

export default function MentalMath({ onComplete }: Props) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro')
  const [problem, setProblem] = useState<Problem>(() => genProblem(0))
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [result, setResult] = useState<GameResultData | null>(null)
  const [startTimestamp] = useState(Date.now())
  const personalBest = useStore((s) => s.getGameStats('mental-math').personalBest)

  const { seconds, start: startTimer } = useTimer(60, () => endGame(score))

  const nextProblem = useCallback((currentScore: number) => {
    setProblem(genProblem(currentScore))
    setInput('')
    setFeedback(null)
  }, [])

  const handleDigit = (d: string) => {
    if (phase !== 'playing') return
    if (feedback) return
    setInput((prev) => prev + d)
  }

  const handleDelete = () => setInput((prev) => prev.slice(0, -1))

  const handleSubmit = useCallback(() => {
    if (!input || feedback) return
    const userAnswer = parseInt(input, 10)
    if (userAnswer === problem.answer) {
      setFeedback('correct')
      const newScore = score + 1
      setScore(newScore)
      setTimeout(() => nextProblem(newScore), 400)
    } else {
      setFeedback('wrong')
      setTimeout(() => {
        setInput('')
        setFeedback(null)
      }, 600)
    }
  }, [input, problem.answer, feedback, score, nextProblem])

  // Enter key support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== 'playing') return
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key)
      else if (e.key === 'Backspace') handleDelete()
      else if (e.key === 'Enter') handleSubmit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, handleSubmit])

  const endGame = useCallback(
    (finalScore: number) => {
      const duration = Math.round((Date.now() - startTimestamp) / 1000)
      const r: GameResultData = {
        score: finalScore,
        duration,
        label: 'Problems Solved',
        sublabel: `${finalScore} correct in 60 seconds`,
      }
      setResult(r)
      onComplete(r)
      setPhase('done')
    },
    [startTimestamp, onComplete],
  )

  const reset = () => {
    setPhase('intro')
    setScore(0)
    setInput('')
    setFeedback(null)
    setProblem(genProblem(0))
    setResult(null)
  }

  if (phase === 'done' && result) {
    return <GameResult result={result} personalBest={personalBest} gameId="mental-math" onPlayAgain={reset} />
  }

  if (phase === 'intro') {
    return (
      <motion.div
        className="flex flex-col items-center flex-1 px-6 py-8 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl font-black text-emerald-600">∑</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Mental Math</h2>
          <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto leading-relaxed">
            Solve as many arithmetic problems as you can in 60 seconds. Difficulty increases as you score.
          </p>
        </div>

        <MentalMathDemo />

        <div className="w-full space-y-3 text-sm">
          {[
            ['⏱', '60 seconds on the clock'],
            ['📈', 'Problems get harder as you score more'],
            ['⌨️', 'Keyboard supported on desktop'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm">
              <span className="text-xl">{icon}</span>
              <span className="text-gray-600">{text}</span>
            </div>
          ))}
        </div>
        <Button
          size="xl"
          className="w-full"
          onClick={() => {
            setPhase('playing')
            startTimer()
          }}
        >
          Start — 60s
        </Button>
      </motion.div>
    )
  }

  const timerColor = seconds <= 10 ? 'text-red-500' : seconds <= 20 ? 'text-amber-500' : 'text-gray-900'

  return (
    <div className="flex flex-col px-4 pt-6 gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-center">
          <div className="text-sm text-gray-400 font-medium">Score</div>
          <div className="text-3xl font-black font-mono text-gray-900">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400 font-medium">Time</div>
          <div className={`text-3xl font-black font-mono ${timerColor}`}>{seconds}</div>
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-colors ${seconds <= 10 ? 'bg-red-400' : 'bg-emerald-400'}`}
          animate={{ width: `${(seconds / 60) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Problem */}
      <AnimatePresence mode="wait">
        <motion.div
          key={problem.display}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="flex flex-col items-center py-8 gap-4"
        >
          <div className="text-5xl font-black font-mono text-gray-900 tracking-tight">
            {problem.display}
          </div>
          <div className="text-gray-300 text-2xl">=</div>
          <div
            className={`w-full max-w-[240px] h-16 rounded-2xl flex items-center justify-center text-4xl font-bold font-mono border-2 transition-all ${
              feedback === 'correct'
                ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                : feedback === 'wrong'
                ? 'border-red-300 bg-red-50 text-red-500 animate-shake'
                : 'border-gray-200 bg-gray-50 text-gray-900'
            }`}
          >
            {input || <span className="text-gray-300 text-2xl">answer</span>}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(String(d))}
            className="aspect-square rounded-2xl bg-white border border-gray-100 text-xl font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all shadow-sm"
          >
            {d}
          </button>
        ))}
        <button
          onClick={handleDelete}
          className="aspect-square rounded-2xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
        >
          <Delete size={18} className="text-gray-500" />
        </button>
        <button
          onClick={() => handleDigit('0')}
          className="aspect-square rounded-2xl bg-white border border-gray-100 text-xl font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all shadow-sm"
        >
          0
        </button>
        <button
          onClick={handleSubmit}
          disabled={!input}
          className="aspect-square rounded-2xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-40"
        >
          OK
        </button>
      </div>
    </div>
  )
}
