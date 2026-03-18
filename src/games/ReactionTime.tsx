import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../components/ui/Button'
import GameResult from '../components/ui/GameResult'
import { useStore } from '../store'
import type { GameResultData } from '../types'
import { useDemoStep } from '../hooks/useDemoStep'

const RT_DEMO_DURATIONS = [1800, 1200, 1400]
const RT_DEMO_CAPTIONS = ['Wait for the color to change…', 'Green! Tap instantly!', 'Your reaction time — lower is better']

function ReactionTimeDemo() {
  const step = useDemoStep(RT_DEMO_DURATIONS)
  const bg = step === 0 ? 'bg-red-500' : 'bg-emerald-400'
  const label = step === 0 ? 'Wait…' : step === 1 ? 'TAP!' : '261ms'

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-gray-900">
      <div className="flex items-center justify-center" style={{ height: 130 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`w-full h-full flex flex-col items-center justify-center gap-2 rounded-t-2xl ${bg} transition-colors`}
            style={{ height: 130 }}
          >
            <span className="text-4xl font-black text-white tracking-tight">{label}</span>
            {step === 1 && (
              <motion.div
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="w-10 h-10 rounded-full border-2 border-white"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="px-4 py-2 bg-gray-800 text-center">
        <p className="text-xs text-gray-300 font-medium">{RT_DEMO_CAPTIONS[step]}</p>
        <div className="flex gap-1 justify-center mt-1.5">
          {RT_DEMO_DURATIONS.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === step ? 'w-3 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-gray-600'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface Props {
  onComplete: (result: GameResultData) => void
}

type ScreenState = 'ready' | 'waiting' | 'go' | 'too-early' | 'result'

const ROUNDS = 5

export default function ReactionTime({ onComplete }: Props) {
  const [phase, setPhase] = useState<'intro' | 'game' | 'done'>('intro')
  const [screen, setScreen] = useState<ScreenState>('ready')
  const [round, setRound] = useState(1)
  const [times, setTimes] = useState<number[]>([])
  const [result, setResult] = useState<GameResultData | null>(null)
  const [startTime] = useState(Date.now())
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  // Use a ref for goTime so the pointer-down handler reads the exact value with no batching delay
  const goTimeRef = useRef<number>(0)
  const screenRef = useRef<ScreenState>('ready')
  const personalBest = useStore((s) => s.getGameStats('reaction-time').personalBest)

  const startWaiting = () => {
    screenRef.current = 'waiting'
    setScreen('waiting')
    const delay = 1500 + Math.random() * 3500
    timeoutRef.current = setTimeout(() => {
      // Record go-time via ref BEFORE triggering React re-render
      goTimeRef.current = performance.now()
      screenRef.current = 'go'
      setScreen('go')
    }, delay)
  }

  // Use onPointerDown (fires on first touch contact, no 300ms delay)
  const handlePointerDown = () => {
    if (screenRef.current === 'waiting') {
      clearTimeout(timeoutRef.current)
      screenRef.current = 'too-early'
      setScreen('too-early')
      // Auto-recover after showing penalty
      setTimeout(() => {
        screenRef.current = 'ready'
        setScreen('ready')
      }, 1200)
      return
    }

    if (screenRef.current === 'go') {
      // performance.now() gives sub-millisecond precision
      const rt = Math.round(performance.now() - goTimeRef.current)
      const newTimes = [...times, rt]
      setTimes(newTimes)

      if (newTimes.length >= ROUNDS) {
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length)
        const duration = Math.round((Date.now() - startTime) / 1000)
        const r: GameResultData = {
          score: avg,
          reactionTime: avg,
          duration,
          label: 'Avg ms',
          sublabel: `Best: ${Math.min(...newTimes)}ms · Worst: ${Math.max(...newTimes)}ms`,
        }
        setResult(r)
        onComplete(r)
        setPhase('done')
      } else {
        screenRef.current = 'result'
        setScreen('result')
        setTimeout(() => {
          setRound((r) => r + 1)
          screenRef.current = 'ready'
          setScreen('ready')
        }, 1000)
      }
    }

    if (screenRef.current === 'ready') {
      startWaiting()
    }
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const reset = () => {
    clearTimeout(timeoutRef.current)
    setPhase('intro')
    screenRef.current = 'ready'
    setScreen('ready')
    setRound(1)
    setTimes([])
    setResult(null)
  }

  if (phase === 'done' && result) {
    return (
      <GameResult result={result} personalBest={personalBest} gameId="reaction-time" onPlayAgain={reset} />
    )
  }

  if (phase === 'intro') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[80vh] px-6 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚡</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Reaction Time</h2>
          <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto leading-relaxed">
            Wait for the green screen, then tap as fast as humanly possible. 5 rounds.
          </p>
        </div>

        <ReactionTimeDemo />

        <div className="w-full space-y-3 text-sm">
          {[
            ['🔴', 'Red = wait patiently'],
            ['🟢', 'Green = TAP INSTANTLY'],
            ['⚠️', 'Tapping early = penalty round'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm">
              <span className="text-xl">{icon}</span>
              <span className="text-gray-600">{text}</span>
            </div>
          ))}
        </div>
        <Button size="xl" className="w-full" onClick={() => { setPhase('game'); setScreen('ready') }}>
          Begin Test
        </Button>
      </motion.div>
    )
  }

  const getBgColor = () => {
    if (screen === 'go') return 'bg-emerald-400'
    if (screen === 'waiting') return 'bg-red-400'
    if (screen === 'too-early') return 'bg-orange-300'
    return 'bg-gray-100'
  }

  const getLabel = () => {
    if (screen === 'ready') return { title: 'Tap to Start', sub: `Round ${round} of ${ROUNDS}` }
    if (screen === 'waiting') return { title: 'Wait…', sub: 'Get ready' }
    if (screen === 'go') return { title: 'TAP!', sub: '' }
    if (screen === 'too-early') return { title: 'Too Early!', sub: 'Wait for green' }
    if (screen === 'result' && times.length > 0) {
      return { title: `${times[times.length - 1]}ms`, sub: round < ROUNDS ? 'Next round…' : 'Last one!' }
    }
    return { title: '', sub: '' }
  }

  const { title, sub } = getLabel()

  return (
    <div className="flex flex-col px-4 pt-6 gap-4 h-full">
      {/* Progress */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
          Round {round}/{ROUNDS}
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: ROUNDS }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full h-2 transition-all ${
                i < times.length
                  ? 'w-4 bg-gray-900'
                  : i === times.length
                  ? 'w-4 bg-gray-300'
                  : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Times so far */}
      {times.length > 0 && (
        <div className="flex gap-2 justify-center">
          {times.map((t, i) => (
            <div key={i} className="text-xs font-mono bg-white rounded-lg px-2 py-1 text-gray-600 shadow-sm">
              {t}ms
            </div>
          ))}
        </div>
      )}

      {/* Main tap area — onPointerDown fires immediately, no 300ms click delay */}
      <motion.button
        className={`flex-1 rounded-3xl flex flex-col items-center justify-center transition-colors duration-150 ${getBgColor()}`}
        style={{ minHeight: '380px', touchAction: 'manipulation' }}
        onPointerDown={handlePointerDown}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-center pointer-events-none"
          >
            <div
              className={`text-5xl font-black ${
                screen === 'go'
                  ? 'text-white'
                  : screen === 'waiting'
                  ? 'text-white'
                  : 'text-gray-700'
              }`}
            >
              {title}
            </div>
            {sub && (
              <div className={`text-sm mt-2 font-medium ${screen === 'go' || screen === 'waiting' ? 'text-white/80' : 'text-gray-500'}`}>
                {sub}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
