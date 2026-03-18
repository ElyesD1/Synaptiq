import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../components/ui/Button'
import GameResult from '../components/ui/GameResult'
import { useStore } from '../store'
import type { GameResultData } from '../types'
import { Delete } from 'lucide-react'
import { useDemoStep } from '../hooks/useDemoStep'

const DEMO_SEQ = [7, 4, 2]
const DEMO_DURATIONS = [900, 900, 900, 1800, 1200]
const DEMO_CAPTIONS = ['Digit 1 of 3', 'Digit 2 of 3', 'Digit 3 of 3', 'Type them back in order', '✓ Correct!']

function DigitSpanDemo() {
  const step = useDemoStep(DEMO_DURATIONS)
  const isShowing = step <= 2
  const isInput = step === 3
  const isCorrect = step === 4
  const typed = isInput ? '742' : isCorrect ? '742' : ''

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-gray-900">
      <div className="flex flex-col items-center justify-center py-8 gap-4" style={{ minHeight: 130 }}>
        <AnimatePresence mode="wait">
          {isShowing && (
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.18 }}
              className="text-7xl font-black font-mono text-white leading-none"
            >
              {DEMO_SEQ[step]}
            </motion.div>
          )}
          {isInput && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="text-4xl font-black font-mono text-blue-300 tracking-widest border-b-2 border-blue-400 pb-1 px-4">{typed}</div>
            </motion.div>
          )}
          {isCorrect && (
            <motion.div
              key="correct"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="text-4xl font-black font-mono text-emerald-400 tracking-widest">{typed}</div>
              <div className="text-emerald-400 font-bold text-sm">✓ Correct</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="px-4 py-2 bg-gray-800 text-center">
        <p className="text-xs text-gray-300 font-medium">{DEMO_CAPTIONS[step]}</p>
        <div className="flex gap-1 justify-center mt-1.5">
          {DEMO_DURATIONS.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === step ? 'w-3 h-1.5 bg-blue-400' : 'w-1.5 h-1.5 bg-gray-600'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface Props {
  onComplete: (result: GameResultData) => void
}

type Phase = 'ready' | 'showing' | 'input' | 'feedback' | 'gameover'

function generateDigits(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10))
}

export default function DigitSpan({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [spanLength, setSpanLength] = useState(4)
  const [sequence, setSequence] = useState<number[]>([])
  const [currentDigitIdx, setCurrentDigitIdx] = useState(-1)
  const [userInput, setUserInput] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [maxSpan, setMaxSpan] = useState(0)
  const [lives, setLives] = useState(2)
  const [result, setResult] = useState<GameResultData | null>(null)
  const [startTime] = useState(Date.now())
  const personalBest = useStore((s) => s.getGameStats('digit-span').personalBest)

  const startRound = useCallback(
    (length: number) => {
      const digits = generateDigits(length)
      setSequence(digits)
      setCurrentDigitIdx(0)
      setUserInput('')
      setFeedback(null)
      setPhase('showing')
    },
    [],
  )

  // Show digits one by one
  useEffect(() => {
    if (phase !== 'showing') return
    if (currentDigitIdx >= sequence.length) {
      setCurrentDigitIdx(-1)
      setPhase('input')
      return
    }
    const t = setTimeout(() => {
      setCurrentDigitIdx((i) => i + 1)
    }, 850)
    return () => clearTimeout(t)
  }, [phase, currentDigitIdx, sequence.length])

  const handleDigit = (d: number) => {
    if (phase !== 'input') return
    setUserInput((prev) => prev + d)
  }

  const handleDelete = () => {
    setUserInput((prev) => prev.slice(0, -1))
  }

  const handleSubmit = () => {
    if (phase !== 'input') return
    const expected = sequence.join('')
    const correct = userInput === expected
    setFeedback(correct ? 'correct' : 'wrong')
    setPhase('feedback')

    if (correct) {
      setMaxSpan((m) => Math.max(m, spanLength))
      setTimeout(() => {
        setSpanLength((s) => s + 1)
        startRound(spanLength + 1)
      }, 1000)
    } else {
      const newLives = lives - 1
      setLives(newLives)
      if (newLives <= 0) {
        setTimeout(() => endGame(Math.max(maxSpan, spanLength - 1)), 1200)
      } else {
        setTimeout(() => startRound(spanLength), 1200)
      }
    }
  }

  const endGame = (finalSpan: number) => {
    const duration = Math.round((Date.now() - startTime) / 1000)
    const r: GameResultData = {
      score: finalSpan,
      level: finalSpan,
      duration,
      label: 'Max Digits',
      sublabel: `Longest sequence remembered`,
    }
    setResult(r)
    onComplete(r)
    setPhase('gameover')
  }

  const reset = () => {
    setPhase('ready')
    setSpanLength(4)
    setSequence([])
    setCurrentDigitIdx(-1)
    setUserInput('')
    setFeedback(null)
    setMaxSpan(0)
    setLives(2)
    setResult(null)
  }

  if (phase === 'gameover' && result) {
    return <GameResult result={result} personalBest={personalBest} gameId="digit-span" onPlayAgain={reset} />
  }

  if (phase === 'ready') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[80vh] px-6 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-black font-mono text-blue-600">123</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Digit Span</h2>
          <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto leading-relaxed">
            Digits will flash one at a time. Remember the sequence, then type it back in order.
          </p>
        </div>

        <DigitSpanDemo />

        <div className="w-full space-y-3 text-sm">
          {[
            ['🔢', 'Starts at 4 digits, grows each round'],
            ['⏱', 'Each digit shown for ~800ms'],
            ['💔', '2 lives — then game over'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm">
              <span className="text-xl">{icon}</span>
              <span className="text-gray-600">{text}</span>
            </div>
          ))}
        </div>
        <Button size="xl" className="w-full" onClick={() => startRound(4)}>
          Start Training
        </Button>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col items-center px-4 pt-8 gap-6 min-h-[80vh]">
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
          {spanLength} Digits
        </span>
        <span className="text-sm text-gray-400">
          Best: <span className="font-mono text-gray-700">{Math.max(maxSpan, spanLength - 1)}</span>
        </span>
      </div>

      {/* Digit display */}
      <div className="flex-1 flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {phase === 'showing' && currentDigitIdx < sequence.length && currentDigitIdx >= 0 && (
            <motion.div
              key={currentDigitIdx}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              className="text-[100px] font-black font-mono text-gray-900 leading-none"
            >
              {sequence[currentDigitIdx]}
            </motion.div>
          )}
          {phase === 'showing' && (currentDigitIdx >= sequence.length || currentDigitIdx < 0) && (
            <motion.div
              key="blank"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[100px] font-black font-mono text-gray-200 leading-none"
            >
              ?
            </motion.div>
          )}
          {(phase === 'input' || phase === 'feedback') && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 w-full"
            >
              {/* User input display */}
              <div
                className={`w-full max-w-[280px] min-h-[64px] rounded-2xl flex items-center justify-center text-4xl font-mono font-bold tracking-widest border-2 transition-colors ${
                  feedback === 'correct'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                    : feedback === 'wrong'
                    ? 'border-red-400 bg-red-50 text-red-500'
                    : 'border-gray-200 bg-gray-50 text-gray-900'
                }`}
              >
                {userInput || <span className="text-gray-300">_ _ _</span>}
              </div>

              {feedback === 'wrong' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-500"
                >
                  Correct: <span className="font-mono font-bold text-gray-700">{sequence.join('')}</span>
                </motion.div>
              )}

              {/* Numpad */}
              {phase === 'input' && (
                <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] mt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                    <button
                      key={d}
                      onClick={() => handleDigit(d)}
                      className="aspect-square rounded-2xl bg-white border border-gray-200 text-xl font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all shadow-sm"
                    >
                      {d}
                    </button>
                  ))}
                  <button
                    onClick={handleDelete}
                    className="aspect-square rounded-2xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all shadow-sm"
                  >
                    <Delete size={18} className="text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDigit(0)}
                    className="aspect-square rounded-2xl bg-white border border-gray-200 text-xl font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all shadow-sm"
                  >
                    0
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={userInput.length === 0}
                    className="aspect-square rounded-2xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-40"
                  >
                    OK
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
