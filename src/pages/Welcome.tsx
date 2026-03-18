import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useStore } from '../store'

const GAMES_PREVIEW = [
  { emoji: '🧠', name: 'Memory', color: '#6366F1' },
  { emoji: '⚡', name: 'Reaction', color: '#F59E0B' },
  { emoji: '🔢', name: 'Digits', color: '#3B82F6' },
  { emoji: '🎯', name: 'Aim', color: '#F97316' },
  { emoji: '∑', name: 'Math', color: '#10B981' },
  { emoji: '🎨', name: 'Stroop', color: '#EF4444' },
  { emoji: '🔁', name: 'Sequence', color: '#0D9488' },
  { emoji: '🧩', name: 'Pattern', color: '#64748B' },
]

const CHART_POINTS = [18, 32, 26, 44, 38, 55, 50, 68, 63, 82]
const CW = 260
const CH = 90

function chartPath(points: number[]) {
  return points
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (points.length - 1)) * CW} ${CH - (v / 100) * CH}`)
    .join(' ')
}

// ── Slide 0: Brand ────────────────────────────────────────────────────────────
function BrandSlide() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 gap-10">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.1 }}
        className="relative"
      >
        <div className="w-28 h-28 rounded-[2rem] overflow-hidden shadow-2xl">
          <img src="/icon.svg" alt="Synaptiq" className="w-full h-full" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-[2rem] border-2 border-white/30"
          animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-[2rem] border border-white/15"
          animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-center space-y-3"
      >
        <h1 className="text-5xl font-black text-white tracking-tight">Synaptiq</h1>
        <p className="text-white/60 text-lg font-medium">Train smarter. Think faster.</p>
        <p className="text-white/35 text-sm max-w-[260px] mx-auto leading-relaxed">
          A personal cognitive training system built to sharpen the skills that matter most.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex gap-3"
      >
        {['Memory', 'Speed', 'Focus', 'Logic'].map((tag, i) => (
          <motion.span
            key={tag}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 + i * 0.08 }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15 text-white/50"
          >
            {tag}
          </motion.span>
        ))}
      </motion.div>
    </div>
  )
}

// ── Slide 1: Games ────────────────────────────────────────────────────────────
function GamesSlide() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 gap-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">What you'll train</p>
        <h2 className="text-3xl font-black text-white">8 Cognitive Games</h2>
        <p className="text-white/45 text-sm max-w-[260px] mx-auto leading-relaxed">
          Each game isolates a different mental skill — from reaction speed to pattern recognition.
        </p>
      </motion.div>

      <div className="grid grid-cols-4 gap-3 w-full max-w-[280px]">
        {GAMES_PREVIEW.map((g, i) => (
          <motion.div
            key={g.name}
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06, type: 'spring', stiffness: 320, damping: 22 }}
            className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1"
            style={{ backgroundColor: `${g.color}20`, border: `1px solid ${g.color}40` }}
          >
            <span className="text-2xl leading-none">{g.emoji}</span>
            <span className="text-[9px] font-semibold text-white/40">{g.name}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-[280px] space-y-2.5"
      >
        {[
          ['🏆', 'Personal bests tracked automatically'],
          ['📊', 'Real-time accuracy & reaction scores'],
          ['🔥', 'Daily streaks to keep you consistent'],
        ].map(([icon, text]) => (
          <div key={String(text)} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <span className="text-base">{icon}</span>
            <span className="text-xs text-white/55 font-medium">{text}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ── Slide 2: Progress ─────────────────────────────────────────────────────────
function ProgressSlide() {
  const path = chartPath(CHART_POINTS)
  const areaPath = `${path} L ${CW} ${CH} L 0 ${CH} Z`

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 gap-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Your journey</p>
        <h2 className="text-3xl font-black text-white">Track Your Growth</h2>
        <p className="text-white/45 text-sm max-w-[260px] mx-auto leading-relaxed">
          Every session is logged. Watch your scores climb and see exactly where you improve.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-[300px] rounded-2xl p-4"
        style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-white/40 font-medium">Performance score</span>
          <motion.span
            className="text-xs font-bold text-indigo-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            +65% over time
          </motion.span>
        </div>

        <svg width="100%" viewBox={`0 0 ${CW} ${CH + 8}`} style={{ height: 80, overflow: 'visible' }}>
          <defs>
            <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#wGrad)" />
          <motion.path
            d={path}
            fill="none"
            stroke="#818CF8"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.3, ease: 'easeOut' }}
          />
          {/* End dot */}
          <motion.circle
            cx={CW}
            cy={CH - (CHART_POINTS[CHART_POINTS.length - 1] / 100) * CH}
            r={4}
            fill="#818CF8"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.5 }}
          />
        </svg>

        <div className="flex justify-between mt-2">
          <span className="text-xs text-white/25">Session 1</span>
          <span className="text-xs text-white/25">Today</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-3 gap-3 w-full max-w-[300px]"
      >
        {[
          { label: 'Reaction', value: '218ms', color: '#F59E0B' },
          { label: 'Accuracy', value: '94%', color: '#10B981' },
          { label: 'Best Score', value: '32', color: '#6366F1' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl px-2 py-3 text-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="text-lg font-black font-mono" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px] text-white/35 font-medium mt-0.5">{stat.label}</div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ── Slide 3: Name ─────────────────────────────────────────────────────────────
function NameSlide({ name, onChange, onSubmit }: { name: string; onChange: (v: string) => void; onSubmit: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 gap-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <motion.div
          className="text-5xl mb-2"
          animate={{ rotate: [0, 15, -10, 15, 0] }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          👋
        </motion.div>
        <h2 className="text-3xl font-black text-white">What's your name?</h2>
        <p className="text-white/45 text-sm max-w-[260px] mx-auto leading-relaxed">
          We'll personalize your dashboard and greet you every session.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-[280px] space-y-3"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onSubmit() }}
          placeholder="Enter your name…"
          maxLength={30}
          className="w-full rounded-2xl px-5 py-4 text-white text-lg font-semibold placeholder-white/25 focus:outline-none transition-all text-center"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: name.trim() ? '1.5px solid rgba(255,255,255,0.4)' : '1.5px solid rgba(255,255,255,0.15)',
          }}
        />
        {name.trim() && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white/40 text-sm"
          >
            Welcome, <span className="text-white font-semibold">{name.trim()}</span> 👊
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}

// ── Main Welcome ──────────────────────────────────────────────────────────────
export default function Welcome() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const completeWelcome = useStore((s) => s.completeWelcome)
  const TOTAL = 4

  const canProceed = step < TOTAL - 1 || name.trim().length > 0

  const next = () => {
    if (step < TOTAL - 1) {
      setStep((s) => s + 1)
    } else {
      completeWelcome(name)
    }
  }

  const slides = [
    <BrandSlide />,
    <GamesSlide />,
    <ProgressSlide />,
    <NameSlide name={name} onChange={setName} onSubmit={next} />,
  ]

  return (
    <div
      className="min-h-dvh flex flex-col select-none"
      style={{ background: 'linear-gradient(145deg, #080818 0%, #13082a 55%, #0c1022 100%)' }}
    >
      {/* Slides */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="flex flex-col flex-1"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            {slides[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-8 pb-12 flex flex-col items-center gap-5">
        {/* Progress dots */}
        <div className="flex gap-2 items-center">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === step ? 20 : 6, opacity: i === step ? 1 : 0.3 }}
              className="h-1.5 rounded-full bg-white"
              transition={{ duration: 0.25 }}
            />
          ))}
        </div>

        {/* CTA button */}
        <motion.button
          onClick={next}
          disabled={!canProceed}
          whileTap={{ scale: canProceed ? 0.96 : 1 }}
          className="w-full max-w-[300px] py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
          style={{
            background: canProceed ? '#fff' : 'rgba(255,255,255,0.12)',
            color: canProceed ? '#0d0d14' : 'rgba(255,255,255,0.3)',
            cursor: canProceed ? 'pointer' : 'not-allowed',
          }}
        >
          {step === TOTAL - 1 ? 'Start Training' : 'Continue'}
          <ChevronRight size={18} />
        </motion.button>

        {/* Skip — only on non-last slides */}
        {step < TOTAL - 1 && (
          <button
            onClick={() => setStep(TOTAL - 1)}
            className="text-white/25 text-sm font-medium active:text-white/50"
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  )
}
