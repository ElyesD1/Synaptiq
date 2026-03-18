import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../components/ui/Button'
import GameResult from '../components/ui/GameResult'
import { useStore } from '../store'
import type { GameResultData } from '../types'
import { useDemoStep } from '../hooks/useDemoStep'

// Demo: show sequence [0, 2] then user repeats it
const SEQ_DEMO_COLORS = ['#4F46E5', '#DC2626', '#059669', '#D97706']
const SEQ_DEMO_SEQ = [0, 2] // indigo, green
const SEQ_DEMO_DURATIONS = [800, 800, 1200, 700, 700, 1000]
const SEQ_DEMO_CAPTIONS = [
  'Watch — button 1 lights up',
  'Then button 3 lights up',
  'Now repeat the sequence from memory',
  'Tap button 1…',
  '…then button 3',
  '✓ Perfect! Next round adds one more',
]

function SequenceMemoryDemo() {
  const step = useDemoStep(SEQ_DEMO_DURATIONS)
  // Which button is lit at each step
  const litMap: Record<number, number> = { 0: 0, 1: 2, 3: 0, 4: 2 }
  const activeBtn = litMap[step] ?? null
  const isTapping = step >= 3 && step <= 4
  const isCorrect = step === 5

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-gray-900">
      <div className="flex flex-col items-center justify-center py-5 gap-4" style={{ minHeight: 130 }}>
        {isCorrect ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="text-emerald-400 font-bold text-lg"
          >
            ✓ Correct!
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3" style={{ width: 120 }}>
            {SEQ_DEMO_COLORS.map((color, i) => {
              const isActive = activeBtn === i
              return (
                <motion.div
                  key={i}
                  className="aspect-square rounded-2xl border-2"
                  style={{
                    backgroundColor: isActive ? color : `${color}22`,
                    borderColor: color,
                    boxShadow: isActive ? `0 0 16px ${color}80` : 'none',
                  }}
                  animate={{ scale: isActive ? 1.08 : 1 }}
                  transition={{ duration: 0.15 }}
                />
              )
            })}
          </div>
        )}
        {step === 2 && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-xs text-teal-300 font-semibold uppercase tracking-widest"
          >
            Your turn!
          </motion.p>
        )}
        {isTapping && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-xs text-gray-400"
          >
            Tap {step === 3 ? '1st' : '2nd'} button…
          </motion.p>
        )}
      </div>
      <div className="px-4 py-2 bg-gray-800 text-center">
        <p className="text-xs text-gray-300 font-medium">{SEQ_DEMO_CAPTIONS[step]}</p>
        <div className="flex gap-1 justify-center mt-1.5">
          {SEQ_DEMO_DURATIONS.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === step ? 'w-3 h-1.5 bg-teal-400' : 'w-1.5 h-1.5 bg-gray-600'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface Props {
  onComplete: (result: GameResultData) => void
}

const BUTTON_COLORS = ['#4F46E5', '#DC2626', '#059669', '#D97706']
const FLASH_DURATION = 500
const FLASH_GAP = 250
const SPEED_BY_LEVEL = [650, 550, 450, 380, 320]

export default function SequenceMemory({ onComplete }: Props) {
  const [phase, setPhase] = useState<'intro' | 'showing' | 'input' | 'feedback' | 'gameover'>('intro')
  const [sequence, setSequence] = useState<number[]>([])
  const [userSeq, setUserSeq] = useState<number[]>([])
  const [activeBtn, setActiveBtn] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null)
  const [result, setResult] = useState<GameResultData | null>(null)
  const [startTime] = useState(Date.now())
  const canInput = useRef(false)
  const personalBest = useStore((s) => s.getGameStats('sequence-memory').personalBest)

  const speed = SPEED_BY_LEVEL[Math.min(Math.floor(sequence.length / 3), SPEED_BY_LEVEL.length - 1)]

  const playSequence = useCallback(async (seq: number[]) => {
    canInput.current = false
    setPhase('showing')
    await new Promise((r) => setTimeout(r, 600))

    for (const btn of seq) {
      setActiveBtn(btn)
      await new Promise((r) => setTimeout(r, FLASH_DURATION))
      setActiveBtn(null)
      await new Promise((r) => setTimeout(r, FLASH_GAP))
    }

    setPhase('input')
    setUserSeq([])
    canInput.current = true
  }, [])

  const startRound = useCallback(
    (prev: number[]) => {
      const newSeq = [...prev, Math.floor(Math.random() * 4)]
      setSequence(newSeq)
      playSequence(newSeq)
    },
    [playSequence],
  )

  const handleButton = useCallback(
    (idx: number) => {
      if (!canInput.current) return
      setActiveBtn(idx)
      setTimeout(() => setActiveBtn(null), 180)

      const newUserSeq = [...userSeq, idx]
      setUserSeq(newUserSeq)

      // Check correctness so far
      const pos = newUserSeq.length - 1
      if (newUserSeq[pos] !== sequence[pos]) {
        // Wrong!
        canInput.current = false
        setFeedback('bad')
        setPhase('feedback')
        setTimeout(() => {
          const duration = Math.round((Date.now() - startTime) / 1000)
          const r: GameResultData = {
            score: sequence.length - 1,
            level: sequence.length - 1,
            duration,
            label: 'Longest Sequence',
            sublabel: `Reached ${sequence.length - 1} buttons`,
          }
          setResult(r)
          onComplete(r)
          setPhase('gameover')
        }, 1200)
        return
      }

      if (newUserSeq.length === sequence.length) {
        // Full sequence correct
        canInput.current = false
        setFeedback('good')
        setTimeout(() => {
          setFeedback(null)
          startRound(sequence)
        }, 600)
      }
    },
    [userSeq, sequence, startTime, onComplete, startRound],
  )

  const reset = () => {
    setPhase('intro')
    setSequence([])
    setUserSeq([])
    setActiveBtn(null)
    setFeedback(null)
    setResult(null)
  }

  if (phase === 'gameover' && result) {
    return <GameResult result={result} personalBest={personalBest} gameId="sequence-memory" onPlayAgain={reset} />
  }

  if (phase === 'intro') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center flex-1 px-6 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <div className="grid grid-cols-2 gap-1">
              {BUTTON_COLORS.map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-lg" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Sequence Memory</h2>
          <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto leading-relaxed">
            Watch the sequence of colored buttons flash. Repeat it in exact order. The sequence grows each round.
          </p>
        </div>
        <SequenceMemoryDemo />

        <div className="w-full space-y-3 text-sm">
          {[
            ['👁', 'Watch the sequence carefully'],
            ['👆', 'Repeat by tapping buttons in order'],
            ['📈', 'One new button added each correct round'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm">
              <span className="text-xl">{icon}</span>
              <span className="text-gray-600">{text}</span>
            </div>
          ))}
        </div>
        <Button size="xl" className="w-full" onClick={() => startRound([])}>
          Start
        </Button>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col items-center px-4 pt-8 gap-8 flex-1">
      {/* Header */}
      <div className="flex justify-between items-center w-full">
        <div className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
          Round {sequence.length}
        </div>
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`text-sm font-bold px-3 py-1 rounded-xl ${
                feedback === 'good' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
              }`}
            >
              {feedback === 'good' ? '✓ Perfect!' : '✗ Wrong!'}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="text-sm font-mono text-gray-400">
          {userSeq.length}/{sequence.length}
        </div>
      </div>

      {/* Phase indicator */}
      <div className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
        phase === 'showing' ? 'bg-amber-50 text-amber-600' : phase === 'input' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
      }`}>
        {phase === 'showing' ? 'Watch the sequence...' : phase === 'input' ? 'Your turn — repeat it!' : 'Get ready...'}
      </div>

      {/* Buttons grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-[280px]">
        {BUTTON_COLORS.map((color, i) => (
          <motion.button
            key={i}
            className="aspect-square rounded-3xl transition-all duration-100 active:scale-95 touch-manipulation"
            style={{
              backgroundColor: activeBtn === i ? color : `${color}33`,
              border: `3px solid ${color}`,
              boxShadow: activeBtn === i ? `0 0 20px ${color}60` : 'none',
            }}
            animate={{
              scale: activeBtn === i ? 1.05 : 1,
              opacity: phase === 'showing' && activeBtn !== i ? 0.5 : 1,
            }}
            onClick={() => handleButton(i)}
          />
        ))}
      </div>

      {/* Progress — neutral dots only (no color hints) */}
      <div className="flex flex-wrap justify-center gap-1.5 max-w-[240px]">
        {sequence.map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < userSeq.length ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
