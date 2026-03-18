import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../components/ui/Button'
import GameResult from '../components/ui/GameResult'
import { useStore } from '../store'
import type { GameResultData } from '../types'
import { useDemoStep } from '../hooks/useDemoStep'

const STROOP_DEMO_DURATIONS = [2000, 1400, 1200]
const STROOP_DEMO_CAPTIONS = [
  '"GREEN" — but the ink is RED. What color is the ink?',
  'Ignore the word. Tap the ink color: RED',
  '✓ Correct! The word tries to trick you',
]
// Demo: show "GREEN" in red ink, buttons, then highlight RED button
function StroopDemo() {
  const step = useDemoStep(STROOP_DEMO_DURATIONS)
  const demoButtons = ['RED', 'BLUE', 'GREEN', 'AMBER', 'PURPLE', 'TEAL']
  const demoColors: Record<string, string> = {
    RED: '#EF4444', BLUE: '#3B82F6', GREEN: '#10B981',
    AMBER: '#F59E0B', PURPLE: '#8B5CF6', TEAL: '#0D9488',
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-gray-900">
      <div className="flex flex-col items-center justify-center py-5 gap-3" style={{ minHeight: 130 }}>
        <div className="text-4xl font-black tracking-tight" style={{ color: '#EF4444' }}>
          GREEN
        </div>
        <div className="grid grid-cols-3 gap-1.5 w-full px-5">
          {demoButtons.map((name) => {
            const isTarget = name === 'RED'
            const highlight = step >= 1 && isTarget
            return (
              <motion.div
                key={name}
                className="rounded-xl py-1.5 text-center text-xs font-bold text-white"
                style={{ backgroundColor: demoColors[name] }}
                animate={highlight ? { scale: [1, 1.12, 1.12] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {highlight && step === 2 ? '✓' : name}
              </motion.div>
            )
          })}
        </div>
      </div>
      <div className="px-4 py-2 bg-gray-800 text-center">
        <p className="text-xs text-gray-300 font-medium">{STROOP_DEMO_CAPTIONS[step]}</p>
        <div className="flex gap-1 justify-center mt-1.5">
          {STROOP_DEMO_DURATIONS.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === step ? 'w-3 h-1.5 bg-rose-400' : 'w-1.5 h-1.5 bg-gray-600'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface Props {
  onComplete: (result: GameResultData) => void
}

interface StroopTrial {
  word: string
  inkColor: string
  inkHex: string
  congruent: boolean
}

// 6 colors makes it significantly harder — more options, harder to scan buttons
const COLORS: { name: string; hex: string }[] = [
  { name: 'RED', hex: '#EF4444' },
  { name: 'BLUE', hex: '#3B82F6' },
  { name: 'GREEN', hex: '#10B981' },
  { name: 'AMBER', hex: '#F59E0B' },
  { name: 'PURPLE', hex: '#8B5CF6' },
  { name: 'TEAL', hex: '#0D9488' },
]

const TOTAL_TRIALS = 30
const TRIAL_TIMEOUT_MS = 3000 // auto-advance as wrong after 3s

function generateTrials(): StroopTrial[] {
  const trials: StroopTrial[] = []
  for (let i = 0; i < TOTAL_TRIALS; i++) {
    const wordIdx = Math.floor(Math.random() * COLORS.length)
    // Only 10% congruent — maximize interference
    const congruent = Math.random() < 0.10
    let inkIdx: number
    if (congruent) {
      inkIdx = wordIdx
    } else {
      // Pick an ink color different from the word, but also vary so adjacent trials differ
      do {
        inkIdx = Math.floor(Math.random() * COLORS.length)
      } while (inkIdx === wordIdx)
    }
    trials.push({
      word: COLORS[wordIdx].name,
      inkColor: COLORS[inkIdx].name,
      inkHex: COLORS[inkIdx].hex,
      congruent,
    })
  }
  return trials
}

// Shuffle the button order each trial so muscle memory can't help
function shuffleColors() {
  return [...COLORS].sort(() => Math.random() - 0.5)
}

export default function StroopTest({ onComplete }: Props) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro')
  const [trials] = useState<StroopTrial[]>(() => generateTrials())
  const [trialIdx, setTrialIdx] = useState(0)
  const [buttonOrder, setButtonOrder] = useState(() => shuffleColors())
  const [correct, setCorrect] = useState(0)
  const [incorrect, setIncorrect] = useState(0)
  const [timeouts, setTimeouts] = useState(0)
  const [rts, setRts] = useState<number[]>([])
  const [trialStartTime, setTrialStartTime] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null)
  const [result, setResult] = useState<GameResultData | null>(null)
  const [startTimestamp] = useState(Date.now())
  const [timeLeftPct, setTimeLeftPct] = useState(100)
  const canRespondRef = useRef(true)
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const tickRef = useRef<ReturnType<typeof setInterval>>()
  const personalBest = useStore((s) => s.getGameStats('stroop').personalBest)

  const finalize = useCallback(
    (finalCorrect: number, finalIncorrect: number, finalTimeouts: number, finalRts: number[]) => {
      const total = TOTAL_TRIALS
      const accuracy = Math.round((finalCorrect / total) * 100)
      const avgRt = finalRts.length > 0
        ? Math.round(finalRts.reduce((a, b) => a + b, 0) / finalRts.length)
        : 0
      const duration = Math.round((Date.now() - startTimestamp) / 1000)
      const r: GameResultData = {
        score: accuracy,
        accuracy,
        reactionTime: avgRt,
        duration,
        label: 'Accuracy %',
        sublabel: `${finalCorrect} correct · ${finalTimeouts} timed out · avg ${avgRt}ms`,
      }
      setResult(r)
      onComplete(r)
      setPhase('done')
    },
    [startTimestamp, onComplete],
  )

  const advanceTrial = useCallback(
    (
      nextTrialIdx: number,
      newCorrect: number,
      newIncorrect: number,
      newTimeouts: number,
      newRts: number[],
    ) => {
      clearTimeout(timeoutTimerRef.current)
      clearInterval(tickRef.current)

      if (nextTrialIdx >= TOTAL_TRIALS) {
        finalize(newCorrect, newIncorrect, newTimeouts, newRts)
        return
      }

      setTimeout(() => {
        setFeedback(null)
        setTrialIdx(nextTrialIdx)
        setButtonOrder(shuffleColors()) // shuffle buttons every trial
        setTrialStartTime(Date.now())
        setTimeLeftPct(100)
        canRespondRef.current = true

        // Start timeout countdown
        const startTs = Date.now()
        tickRef.current = setInterval(() => {
          const elapsed = Date.now() - startTs
          setTimeLeftPct(Math.max(0, 100 - (elapsed / TRIAL_TIMEOUT_MS) * 100))
        }, 50)

        timeoutTimerRef.current = setTimeout(() => {
          if (!canRespondRef.current) return
          canRespondRef.current = false
          clearInterval(tickRef.current)
          const newT = newTimeouts + 1
          setTimeouts(newT)
          setFeedback('timeout')
          advanceTrial(nextTrialIdx + 1, newCorrect, newIncorrect + 1, newT, newRts)
        }, TRIAL_TIMEOUT_MS)
      }, 300)
    },
    [finalize],
  )

  // Start first trial
  useEffect(() => {
    if (phase !== 'playing') return
    setTrialStartTime(Date.now())
    setTimeLeftPct(100)
    canRespondRef.current = true

    const startTs = Date.now()
    tickRef.current = setInterval(() => {
      const elapsed = Date.now() - startTs
      setTimeLeftPct(Math.max(0, 100 - (elapsed / TRIAL_TIMEOUT_MS) * 100))
    }, 50)

    timeoutTimerRef.current = setTimeout(() => {
      if (!canRespondRef.current) return
      canRespondRef.current = false
      clearInterval(tickRef.current)
      setTimeouts(1)
      setFeedback('timeout')
      advanceTrial(1, 0, 1, 1, [])
    }, TRIAL_TIMEOUT_MS)

    return () => {
      clearTimeout(timeoutTimerRef.current)
      clearInterval(tickRef.current)
    }
  }, [phase]) // eslint-disable-line

  const handleResponse = useCallback(
    (colorName: string) => {
      if (!canRespondRef.current) return
      canRespondRef.current = false
      clearTimeout(timeoutTimerRef.current)
      clearInterval(tickRef.current)

      const rt = Date.now() - trialStartTime
      const trial = trials[trialIdx]
      const isCorrect = colorName === trial.inkColor
      const newRts = isCorrect ? [...rts, rt] : rts

      if (isCorrect) {
        setCorrect((c) => {
          const nc = c + 1
          setFeedback('correct')
          advanceTrial(trialIdx + 1, nc, incorrect, timeouts, newRts)
          return nc
        })
        setRts(newRts)
      } else {
        setIncorrect((i) => {
          const ni = i + 1
          setFeedback('wrong')
          advanceTrial(trialIdx + 1, correct, ni, timeouts, newRts)
          return ni
        })
      }
    },
    [trialIdx, trials, trialStartTime, rts, correct, incorrect, timeouts, advanceTrial],
  )

  const reset = () => {
    clearTimeout(timeoutTimerRef.current)
    clearInterval(tickRef.current)
    setPhase('intro')
    setTrialIdx(0)
    setButtonOrder(shuffleColors())
    setCorrect(0)
    setIncorrect(0)
    setTimeouts(0)
    setRts([])
    setFeedback(null)
    setResult(null)
    setTimeLeftPct(100)
  }

  if (phase === 'done' && result) {
    return <GameResult result={result} personalBest={personalBest} gameId="stroop" onPlayAgain={reset} />
  }

  if (phase === 'intro') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center flex-1 px-6 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold" style={{ color: '#3B82F6' }}>RED</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Stroop Test</h2>
          <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto leading-relaxed">
            Tap the <strong>ink color</strong> of the word, not what the word says.
            Button positions shuffle every trial.
          </p>
        </div>

        <StroopDemo />

        <div className="w-full bg-gray-50 rounded-2xl p-4 text-center">
          <div className="text-xs text-gray-400 mb-2 uppercase tracking-widest font-medium">Example</div>
          <div className="text-4xl font-black mb-3" style={{ color: '#10B981' }}>BLUE</div>
          <div className="text-sm text-gray-500">
            → Tap <span className="text-emerald-600 font-bold">GREEN</span> (the ink color)
          </div>
        </div>
        <div className="w-full space-y-2 text-sm">
          {[
            ['🎨', '6 colors, buttons shuffle each trial'],
            ['⏱', '3 seconds per trial — then auto-wrong'],
            ['⚡', '30 trials total'],
          ].map(([icon, text]) => (
            <div key={String(text)} className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm">
              <span className="text-xl">{icon}</span>
              <span className="text-gray-600">{text}</span>
            </div>
          ))}
        </div>
        <Button size="xl" className="w-full" onClick={() => setPhase('playing')}>
          Start Test — 30 Trials
        </Button>
      </motion.div>
    )
  }

  const trial = trials[trialIdx]
  const progress = (trialIdx / TOTAL_TRIALS) * 100

  return (
    <div className="flex flex-col px-4 pt-6 gap-5 flex-1">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
          {trialIdx + 1} / {TOTAL_TRIALS}
        </span>
        <div className="flex gap-3 text-sm font-mono">
          <span className="text-emerald-600 font-semibold">{correct} ✓</span>
          <span className="text-red-400 font-semibold">{incorrect} ✗</span>
        </div>
      </div>

      {/* Progress + time bar stacked */}
      <div className="space-y-1.5">
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-rose-400 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        {/* Per-trial countdown */}
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full transition-none"
            style={{
              width: `${timeLeftPct}%`,
              backgroundColor: timeLeftPct > 40 ? '#10B981' : timeLeftPct > 15 ? '#F59E0B' : '#EF4444',
            }}
          />
        </div>
      </div>

      {/* Word display */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={trialIdx}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.12 }}
            className="text-center"
          >
            <div
              className="text-6xl font-black tracking-tight select-none"
              style={{ color: trial.inkHex }}
            >
              {trial.word}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback flash */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-center text-sm font-semibold ${
              feedback === 'correct' ? 'text-emerald-500' : feedback === 'timeout' ? 'text-amber-500' : 'text-red-400'
            }`}
          >
            {feedback === 'correct' ? '✓ Correct' : feedback === 'timeout' ? '⏱ Too slow' : '✗ Wrong'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color buttons — shuffled every trial */}
      <div className="grid grid-cols-3 gap-2.5 pb-4">
        {buttonOrder.map(({ name, hex }) => (
          <motion.button
            key={name}
            className="rounded-2xl py-4 font-bold text-white text-sm transition-all active:scale-95 shadow-sm select-none touch-manipulation"
            style={{ backgroundColor: hex }}
            onPointerDown={() => handleResponse(name)}
            whileTap={{ scale: 0.94 }}
          >
            {name}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
