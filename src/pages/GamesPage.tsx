import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Clock, Star } from 'lucide-react'
import { useStore } from '../store'
import { GAMES } from '../data/games'

const CATEGORIES = [
  'All',
  'Spatial Memory',
  'Working Memory',
  'Processing Speed',
  'Verbal Memory',
  'Numerical Reasoning',
  'Cognitive Control',
  'Sequential Memory',
  'Fluid Intelligence',
]

export default function GamesPage() {
  const navigate = useNavigate()
  const { getGameStats } = useStore()

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Games</h1>
        <p className="text-sm text-gray-400 mt-0.5">8 cognitive training modules</p>
      </motion.div>

      {/* Games list */}
      <div className="space-y-3">
        {GAMES.map((game, i) => {
          const stats = getGameStats(game.id)
          const lastSession = stats.sessions[0]

          return (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/game/${game.id}`)}
              className="w-full bg-white rounded-3xl p-4 text-left active:scale-[0.98] transition-transform shadow-sm border border-gray-50 hover:border-gray-200"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl ${game.bgClass} flex items-center justify-center flex-shrink-0`}
                >
                  <BigGameIcon name={game.icon} color={game.color} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900 text-base">{game.name}</div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </div>
                  <div
                    className="text-xs font-medium mt-0.5 inline-block px-1.5 py-0.5 rounded-md"
                    style={{ color: game.color, backgroundColor: `${game.color}15` }}
                  >
                    {game.category}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 line-clamp-1">{game.description}</div>

                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={11} />
                      ~{game.estimatedMinutes}m
                    </div>
                    {stats.personalBest > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Star size={11} className="text-amber-400" />
                        Best: <span className="font-mono text-gray-600 font-semibold">{stats.personalBest}</span>
                        <span className="text-gray-300">{game.scoreLabel}</span>
                      </div>
                    )}
                    {stats.totalPlays === 0 && (
                      <span className="text-xs text-blue-500 font-medium">New</span>
                    )}
                    {lastSession && (
                      <span className="text-xs text-gray-300 ml-auto">
                        {stats.totalPlays}x played
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function BigGameIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill={color} />
        <rect x="11" y="1" width="6" height="6" rx="1.5" fill={color} opacity="0.4" />
        <rect x="1" y="11" width="6" height="6" rx="1.5" fill={color} opacity="0.4" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" fill={color} />
      </svg>
    ),
    repeat: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill={color}>
        <path d="M3 9a6 6 0 0 1 6-6h3l-2-2M15 9a6 6 0 0 1-6 6H6l2 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    hash: (
      <svg width="24" height="24" viewBox="0 0 18 18" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none">
        <line x1="7" y1="2" x2="5" y2="16" />
        <line x1="13" y1="2" x2="11" y2="16" />
        <line x1="2" y1="7" x2="16" y2="7" />
        <line x1="2" y1="11" x2="16" y2="11" />
      </svg>
    ),
    zap: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    calculator: (
      <svg width="24" height="24" viewBox="0 0 18 18" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none">
        <rect x="2" y="2" width="14" height="14" rx="2" />
        <line x1="6" y1="9" x2="12" y2="9" />
        <line x1="9" y1="6" x2="9" y2="12" />
      </svg>
    ),
    eye: (
      <svg width="24" height="24" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    activity: (
      <svg width="24" height="24" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    target: (
      <svg width="24" height="24" viewBox="0 0 24 24" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" fill={color} />
      </svg>
    ),
    shapes: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
        <circle cx="5" cy="5" r="3.5" fill={color} opacity="0.9" />
        <rect x="10" y="2" width="6" height="6" rx="1" fill={color} opacity="0.5" />
        <path d="M9 10l5 8H4l5-8z" fill={color} opacity="0.7" />
      </svg>
    ),
  }
  return <>{icons[name] ?? <span style={{ color, fontSize: 18, fontWeight: 800 }}>{name[0].toUpperCase()}</span>}</>
}
