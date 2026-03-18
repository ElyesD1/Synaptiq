import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Brain, Zap, ChevronRight, Target, Trophy } from 'lucide-react'
import { useStore } from '../store'
import { GAMES } from '../data/games'

const DAILY_GAMES = ['memory-matrix', 'reaction-time', 'mental-math', 'aim-training']

const HOUR_GREETINGS: Record<string, string> = {
  night: "Night owl mode",
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 5) return 'night'
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function getDayOfWeek() {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]
}

export default function Home() {
  const navigate = useNavigate()
  const { playerName, streak, totalGamesPlayed, getGameStats } = useStore()

  const dailyGames = GAMES.filter((g) => DAILY_GAMES.includes(g.id))
  const totalMinutes = Math.round(totalGamesPlayed * 2.5)
  const avgAccuracy = (() => {
    const all = GAMES.flatMap((g) => getGameStats(g.id).sessions)
    if (all.length === 0) return 0
    const withAcc = all.filter((s) => s.accuracy !== undefined)
    if (withAcc.length === 0) return 0
    return Math.round(withAcc.reduce((sum, s) => sum + (s.accuracy ?? 0), 0) / withAcc.length)
  })()

  const greeting = HOUR_GREETINGS[getTimeOfDay()]

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <p className="text-sm text-gray-400 font-medium">{greeting},</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{playerName}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{getDayOfWeek()} · Keep pushing</p>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2">
          <Flame size={16} className="text-amber-500" />
          <span className="text-sm font-bold text-amber-600">{streak.current}</span>
          <span className="text-xs text-amber-500">day streak</span>
        </div>
      </motion.div>

      {/* Daily Training Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onClick={() => navigate('/game/memory-matrix')}
        className="relative bg-gray-900 rounded-3xl p-6 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full border-4 border-white translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full border-4 border-white -translate-x-8 translate-y-8" />
        </div>

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Today's Training
              </div>
              <div className="text-2xl font-bold text-white">Brain Workout</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-2">
              <Brain size={22} className="text-white" />
            </div>
          </div>

          <div className="flex gap-2 mb-5">
            {dailyGames.map((g) => (
              <div
                key={g.id}
                className="h-1.5 flex-1 rounded-full bg-white/20"
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div>
                <div className="text-xl font-bold text-white">{DAILY_GAMES.length}</div>
                <div className="text-xs text-gray-400">games</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">~12</div>
                <div className="text-xs text-gray-400">minutes</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white text-gray-900 rounded-2xl px-4 py-2.5 font-semibold text-sm">
              Start <ChevronRight size={15} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <StatCard
          icon={<Trophy size={16} className="text-amber-500" />}
          value={totalGamesPlayed.toString()}
          label="Games Played"
          bg="bg-amber-50"
        />
        <StatCard
          icon={<Target size={16} className="text-blue-500" />}
          value={avgAccuracy > 0 ? `${avgAccuracy}%` : '—'}
          label="Avg Accuracy"
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Zap size={16} className="text-violet-500" />}
          value={totalMinutes > 0 ? `${totalMinutes}m` : '—'}
          label="Total Training"
          bg="bg-violet-50"
        />
      </motion.div>

      {/* Cognitive Domains */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Train Games</h2>
          <button
            onClick={() => navigate('/games')}
            className="text-xs text-gray-400 font-medium hover:text-gray-600 flex items-center gap-0.5"
          >
            All <ChevronRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {GAMES.map((game, i) => {
            const stats = getGameStats(game.id)
            return (
              <motion.button
                key={game.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                onClick={() => navigate(`/game/${game.id}`)}
                className="bg-white rounded-2xl p-4 text-left active:scale-[0.97] transition-transform shadow-sm border border-gray-50 hover:border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl ${game.bgClass} flex items-center justify-center`}
                  >
                    <GameIcon name={game.icon} color={game.color} />
                  </div>
                  {stats.totalPlays > 0 && (
                    <span className="text-xs font-mono text-gray-400">
                      {stats.personalBest}
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-gray-900 leading-tight">{game.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{game.category}</div>
                {stats.totalPlays > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          backgroundColor: game.color,
                          width: `${Math.min(100, (stats.totalPlays / 20) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 font-mono">{stats.totalPlays}x</span>
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  bg,
}: {
  icon: ReactNode
  value: string
  label: string
  bg: string
}) {
  return (
    <div className={`${bg} rounded-2xl p-3`}>
      <div className="mb-1">{icon}</div>
      <div className="text-xl font-bold font-mono text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 font-medium leading-tight">{label}</div>
    </div>
  )
}

function GameIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill={color} />
        <rect x="11" y="1" width="6" height="6" rx="1.5" fill={color} opacity="0.4" />
        <rect x="1" y="11" width="6" height="6" rx="1.5" fill={color} opacity="0.4" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" fill={color} />
      </svg>
    ),
    repeat: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill={color}>
        <path d="M3 9a6 6 0 0 1 6-6h3l-2-2M15 9a6 6 0 0 1-6 6H6l2 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    hash: (
      <svg width="18" height="18" viewBox="0 0 18 18" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none">
        <line x1="7" y1="2" x2="5" y2="16" />
        <line x1="13" y1="2" x2="11" y2="16" />
        <line x1="2" y1="7" x2="16" y2="7" />
        <line x1="2" y1="11" x2="16" y2="11" />
      </svg>
    ),
    zap: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    calculator: (
      <svg width="18" height="18" viewBox="0 0 18 18" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none">
        <rect x="2" y="2" width="14" height="14" rx="2" />
        <line x1="6" y1="9" x2="12" y2="9" />
        <line x1="9" y1="6" x2="9" y2="12" />
      </svg>
    ),
    eye: (
      <svg width="18" height="18" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    activity: (
      <svg width="18" height="18" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    target: (
      <svg width="18" height="18" viewBox="0 0 24 24" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" fill={color} />
      </svg>
    ),
    shapes: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="5" cy="5" r="3.5" fill={color} opacity="0.9" />
        <rect x="10" y="2" width="6" height="6" rx="1" fill={color} opacity="0.5" />
        <path d="M9 10l5 8H4l5-8z" fill={color} opacity="0.7" />
      </svg>
    ),
  }

  return <>{icons[name] ?? <span style={{ color, fontSize: 14, fontWeight: 700 }}>{name[0].toUpperCase()}</span>}</>
}
