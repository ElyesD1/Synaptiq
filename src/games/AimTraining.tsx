import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../components/ui/Button'
import GameResult from '../components/ui/GameResult'
import { useStore } from '../store'
import type { GameResultData } from '../types'
import { useDemoStep } from '../hooks/useDemoStep'
import { useTimer } from '../hooks/useTimer'

interface Props {
  onComplete: (result: GameResultData) => void
}

interface Target {
  id: number
  x: number // % from left (10–78)
  y: number // % from top (10–78)
  size: number
  spawnTime: number
}

const GAME_DURATION = 30
const TARGET_LIFETIME = 1600 // ms before auto-miss
const MIN_GAP = 150          // ms between targets

function randBetween(a: number, b: number) {
  return a + Math.random() * (b - a)
}

function genTarget(score: number, prevX?: number, prevY?: number): Target {
  // Size shrinks with score: 70 → 42px
  const size = Math.max(42, 70 - score * 2)
  let x: number, y: number
  // Avoid spawning too close to previous target
  do {
    x = randBetween(8, 80)
    y = randBetween(8, 80)
  } while (
    prevX !== undefined &&
    prevY !== undefined &&
    Math.abs(x - prevX) < 18 &&
    Math.abs(y - prevY) < 18
  )
  return { id: Date.now(), x, y, size, spawnTime: performance.now() }
}

// ─── Demo ────────────────────────────────────────────────────────────────────
const DEMO_DURATIONS = [1200, 1600, 700, 1000, 1600, 700, 900]
const DEMO_TARGETS = [
  { x: 38, y: 30, size: 62 },
  { x: 62, y: 55, size: 56 },
]

function AimTrainerDemo() {
  const step = useDemoStep(DEMO_DURATIONS)
  const showTarget = [1, 4].includes(step)
  const showTap = [2, 5].includes(step)
  const targetIdx = step >= 4 ? 1 : 0
  const t = DEMO_TARGETS[targetIdx]
  const captions = [
    'A target appears somewhere on screen',
    'Tap it before the ring runs out',
    '287ms — nice!',
    'New target, different position',
    'Tap again as fast as you can',
    '312ms',
    'Score as many as possible in 30s',
  ]

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-gray-900" style={{ height: 200 }}>
      <div className="relative w-full h-full">
        <AnimatePresence>
          {(showTarget || showTap) && (
            <motion.div
              key={`target-${targetIdx}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="absolute"
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                width: t.size,
                height: t.size,
                transform: 'translate(-50%,-50%)',
              }}
            >
              {/* Countdown ring */}
              <svg
                viewBox={`0 0 ${t.size} ${t.size}`}
                className="absolute inset-0 -rotate-90"
                style={{ width: t.size, height: t.size }}
              >
                <circle
                  cx={t.size / 2} cy={t.size / 2} r={t.size / 2 - 4}
                  fill="none" stroke="#F97316" strokeWidth={3.5} opacity={0.25}
                />
                <motion.circle
                  cx={t.size / 2} cy={t.size / 2} r={t.size / 2 - 4}
                  fill="none" stroke="#F97316" strokeWidth={3.5}
                  strokeDasharray={2 * Math.PI * (t.size / 2 - 4)}
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * (t.size / 2 - 4) }}
                  transition={{ duration: TARGET_LIFETIME / 1000, ease: 'linear' }}
                />
              </svg>
              {/* Inner circle */}
              <div
                className="absolute rounded-full"
                style={{
                  inset: 6,
                  backgroundColor: '#F97316',
                  opacity: 0.9,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap ring */}
        <AnimatePresence>
          {showTap && (
            <motion.div
              key={`tap-${step}`}
              className="absolute rounded-full border-2 border-white pointer-events-none"
              initial={{ scale: 0.3, opacity: 1, width: t.size, height: t.size }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.45 }}
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                transform: 'translate(-50%,-50%)',
              }}
            />
          )}
        </AnimatePresence>

        {/* RT flash */}
        <AnimatePresence>
          {showTap && (
            <motion.div
              key={`rt-${step}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute text-white font-mono font-bold text-sm"
              style={{ left: `${t.x}%`, top: `${t.y + 14}%` }}
            >
              {step === 2 ? '287ms' : '312ms'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score */}
        <div className="absolute top-3 left-4 text-gray-400 text-xs font-mono">
          Score: {step >= 3 ? '1' : '0'}
        </div>
      </div>

      {/* Caption */}
      <div className="px-4 py-2 bg-gray-800 text-center">
        <p className="text-xs text-gray-300 font-medium">{captions[step]}</p>
        <div className="flex gap-1 justify-center mt-1.5">
          {DEMO_DURATIONS.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === step ? 'w-3 h-1.5 bg-orange-400' : 'w-1.5 h-1.5 bg-gray-600'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Game ─────────────────────────────────────────────────────────────────────
export default function AimTraining({ onComplete }: Props) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro')
  const [target, setTarget] = useState<Target | null>(null)
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState(0)
  const [rts, setRts] = useState<number[]>([])
  const [result, setResult] = useState<GameResultData | null>(null)
  const missTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const nextTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const scoreRef = useRef(0)
  const missesRef = useRef(0)
  const rtsRef = useRef<number[]>([])
  const prevPosRef = useRef<{ x: number; y: number }>()
  const personalBest = useStore((s) => s.getGameStats('aim-training').personalBest)

  const { seconds, start: startTimer } = useTimer(GAME_DURATION, () => {
    // Timer complete
    clearTimeout(missTimeoutRef.current)
    clearTimeout(nextTimeoutRef.current)
    setTarget(null)
    const avgRt =
      rtsRef.current.length > 0
        ? Math.round(rtsRef.current.reduce((a, b) => a + b, 0) / rtsRef.current.length)
        : 0
    const hitRate = scoreRef.current + missesRef.current > 0
      ? Math.round((scoreRef.current / (scoreRef.current + missesRef.current)) * 100)
      : 0
    const r: GameResultData = {
      score: scoreRef.current,
      accuracy: hitRate,
      reactionTime: avgRt > 0 ? avgRt : undefined,
      duration: GAME_DURATION,
      label: 'Targets Hit',
      sublabel: `Avg ${avgRt}ms · ${hitRate}% hit rate`,
    }
    setResult(r)
    onComplete(r)
    setPhase('done')
  })

  const spawnTarget = useCallback(() => {
    const prev = prevPosRef.current
    const t = genTarget(scoreRef.current, prev?.x, prev?.y)
    prevPosRef.current = { x: t.x, y: t.y }
    setTarget(t)

    // Auto-miss timeout
    missTimeoutRef.current = setTimeout(() => {
      missesRef.current++
      setMisses(missesRef.current)
      setTarget(null)
      nextTimeoutRef.current = setTimeout(spawnTarget, MIN_GAP)
    }, TARGET_LIFETIME)
  }, [])

  const handleTap = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      if (!target) return
      clearTimeout(missTimeoutRef.current)
      const rt = Math.round(performance.now() - target.spawnTime)
      scoreRef.current++
      rtsRef.current = [...rtsRef.current, rt]
      setScore(scoreRef.current)
      setRts([...rtsRef.current])
      setTarget(null)
      nextTimeoutRef.current = setTimeout(spawnTarget, MIN_GAP)
    },
    [target, spawnTarget],
  )

  useEffect(() => () => {
    clearTimeout(missTimeoutRef.current)
    clearTimeout(nextTimeoutRef.current)
  }, [])

  const startGame = () => {
    scoreRef.current = 0
    missesRef.current = 0
    rtsRef.current = []
    setScore(0)
    setMisses(0)
    setRts([])
    setPhase('playing')
    startTimer()
    nextTimeoutRef.current = setTimeout(spawnTarget, 400)
  }

  const reset = () => {
    clearTimeout(missTimeoutRef.current)
    clearTimeout(nextTimeoutRef.current)
    setPhase('intro')
    setTarget(null)
    setScore(0)
    setMisses(0)
    setRts([])
    setResult(null)
  }

  if (phase === 'done' && result) {
    return <GameResult result={result} personalBest={personalBest} gameId="aim-training" onPlayAgain={reset} />
  }

  if (phase === 'intro') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[80vh] px-6 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎯</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Aim Trainer</h2>
          <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto leading-relaxed">
            Tap the target before its ring runs out. Targets shrink as you score more.
          </p>
        </div>

        {/* Animated demo */}
        <AimTrainerDemo />

        <div className="w-full space-y-2.5 text-sm">
          {[
            ['⏱', `${GAME_DURATION}s on the clock`],
            ['🎯', 'Each target lives for ~1.6s'],
            ['📈', 'Targets get smaller as you improve'],
          ].map(([icon, text]) => (
            <div key={String(text)} className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm">
              <span className="text-xl">{icon}</span>
              <span className="text-gray-600">{text}</span>
            </div>
          ))}
        </div>
        <Button size="xl" className="w-full" onClick={startGame}>
          Start — {GAME_DURATION}s
        </Button>
      </motion.div>
    )
  }

  const timerColor = seconds <= 5 ? 'text-red-500' : seconds <= 10 ? 'text-amber-500' : 'text-gray-900'
  const avgRt = rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0

  return (
    <div className="flex flex-col px-4 pt-4 gap-3" style={{ height: '100%' }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-center">
          <div className="text-3xl font-black font-mono text-gray-900">{score}</div>
          <div className="text-xs text-gray-400 font-medium">Hits</div>
        </div>
        <div className="text-center">
          <div className={`text-3xl font-black font-mono ${timerColor}`}>{seconds}</div>
          <div className="text-xs text-gray-400 font-medium">Seconds</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black font-mono text-gray-400">{misses}</div>
          <div className="text-xs text-gray-400 font-medium">Misses</div>
        </div>
        {avgRt > 0 && (
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-orange-500">{avgRt}ms</div>
            <div className="text-xs text-gray-400 font-medium">Avg RT</div>
          </div>
        )}
      </div>

      {/* Play area */}
      <div
        className="relative flex-1 rounded-3xl bg-gray-50 overflow-hidden"
        style={{ minHeight: 360 }}
      >
        <AnimatePresence>
          {target && (
            <motion.button
              key={target.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              onPointerDown={handleTap}
              className="absolute touch-manipulation select-none focus:outline-none"
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: target.size,
                height: target.size,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Countdown ring */}
              <svg
                viewBox={`0 0 ${target.size} ${target.size}`}
                className="absolute inset-0 -rotate-90"
                style={{ width: target.size, height: target.size }}
              >
                <circle
                  cx={target.size / 2} cy={target.size / 2} r={target.size / 2 - 4}
                  fill="none" stroke="#FB923C" strokeWidth={3} opacity={0.2}
                />
                <motion.circle
                  cx={target.size / 2} cy={target.size / 2} r={target.size / 2 - 4}
                  fill="none" stroke="#F97316" strokeWidth={3.5}
                  strokeDasharray={2 * Math.PI * (target.size / 2 - 4)}
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * (target.size / 2 - 4) }}
                  transition={{ duration: TARGET_LIFETIME / 1000, ease: 'linear' }}
                />
              </svg>
              <div
                className="absolute rounded-full bg-orange-400 active:bg-orange-500"
                style={{ inset: 6 }}
              />
            </motion.button>
          )}
        </AnimatePresence>

        {!target && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          </div>
        )}
      </div>
    </div>
  )
}
