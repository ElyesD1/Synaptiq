import { motion } from 'framer-motion'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { useStore } from '../store'
import { GAMES } from '../data/games'
import { Trophy, Flame, Clock, BarChart2, ChevronDown } from 'lucide-react'
import { useState } from 'react'

const COGNITIVE_DOMAINS = [
  { domain: 'Spatial Mem.', gameId: 'memory-matrix', maxScore: 10 },
  { domain: 'Aim Speed', gameId: 'aim-training', maxScore: 25 },
  { domain: 'Verbal Mem.', gameId: 'digit-span', maxScore: 12 },
  { domain: 'Speed', gameId: 'reaction-time', maxScore: 500, invert: true },
  { domain: 'Numerics', gameId: 'mental-math', maxScore: 30 },
  { domain: 'Attention', gameId: 'stroop', maxScore: 100 },
  { domain: 'Sequential', gameId: 'sequence-memory', maxScore: 20 },
  { domain: 'Fluid IQ', gameId: 'pattern-recognition', maxScore: 10 },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function ProgressPage() {
  const { streak, totalGamesPlayed, getGameStats } = useStore()
  const [selectedGame, setSelectedGame] = useState(GAMES[0].id)
  const [showGamePicker, setShowGamePicker] = useState(false)

  // Radar chart data
  const radarData = COGNITIVE_DOMAINS.map(({ domain, gameId, maxScore, invert }) => {
    const stats = getGameStats(gameId as any)
    const best = stats.personalBest
    let value = 0
    if (best > 0) {
      if (invert) {
        // For reaction time, lower is better — 500ms = 0, 150ms = 100
        value = Math.round(Math.max(0, Math.min(100, ((maxScore - best) / (maxScore - 150)) * 100)))
      } else {
        value = Math.round(Math.min(100, (best / maxScore) * 100))
      }
    }
    return { domain, value, fullMark: 100 }
  })

  const hasAnyData = radarData.some((d) => d.value > 0)

  // Selected game chart
  const selectedStats = getGameStats(selectedGame as any)
  const selectedMeta = GAMES.find((g) => g.id === selectedGame)!
  const chartData = [...selectedStats.sessions]
    .reverse()
    .slice(-15)
    .map((s) => ({
      date: formatDate(s.date),
      score: s.score,
      accuracy: s.accuracy,
    }))

  // Totals
  const totalTime = GAMES.reduce((acc, g) => {
    const stats = getGameStats(g.id as any)
    return acc + stats.sessions.reduce((sum, s) => sum + s.duration, 0)
  }, 0)

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Progress</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your cognitive performance over time</p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="bg-amber-50 rounded-2xl p-3 text-center">
          <Flame size={16} className="text-amber-500 mx-auto mb-1" />
          <div className="text-2xl font-black font-mono text-gray-900">{streak.current}</div>
          <div className="text-xs text-gray-500 font-medium">Streak</div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-3 text-center">
          <BarChart2 size={16} className="text-blue-500 mx-auto mb-1" />
          <div className="text-2xl font-black font-mono text-gray-900">{totalGamesPlayed}</div>
          <div className="text-xs text-gray-500 font-medium">Total Games</div>
        </div>
        <div className="bg-violet-50 rounded-2xl p-3 text-center">
          <Clock size={16} className="text-violet-500 mx-auto mb-1" />
          <div className="text-2xl font-black font-mono text-gray-900">
            {totalTime > 0 ? `${Math.round(totalTime / 60)}m` : '—'}
          </div>
          <div className="text-xs text-gray-500 font-medium">Train Time</div>
        </div>
      </motion.div>

      {/* Cognitive Radar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-5 shadow-sm"
      >
        <h2 className="text-base font-bold text-gray-900 mb-1">Cognitive Profile</h2>
        <p className="text-xs text-gray-400 mb-4">
          {hasAnyData ? 'Based on your personal bests' : 'Play games to build your profile'}
        </p>

        {hasAnyData ? (
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis
                dataKey="domain"
                tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 500 }}
              />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#111827"
                fill="#111827"
                fillOpacity={0.12}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3">🧠</div>
              <div className="text-sm text-gray-400">Play all 8 games to see your cognitive profile</div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {COGNITIVE_DOMAINS.map(({ domain, gameId }) => {
            const stats = getGameStats(gameId as any)
            return (
              <div key={domain} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{domain}</span>
                <span className="font-mono font-semibold text-gray-700">
                  {stats.personalBest > 0 ? stats.personalBest : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Personal Bests */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-3xl p-5 shadow-sm"
      >
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" />
          Personal Records
        </h2>
        <div className="space-y-3">
          {GAMES.map((game) => {
            const stats = getGameStats(game.id as any)
            return (
              <div key={game.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-xl ${game.bgClass} flex items-center justify-center text-[10px] font-bold`}
                    style={{ color: game.color }}
                  >
                    {game.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{game.name}</div>
                    <div className="text-xs text-gray-400">{game.scoreLabel}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black font-mono text-gray-900">
                    {stats.personalBest > 0 ? stats.personalBest : '—'}
                  </div>
                  <div className="text-xs text-gray-400">{stats.totalPlays}x</div>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl p-5 shadow-sm"
      >
        {/* Game picker */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Score History</h2>
          <div className="relative">
            <button
              onClick={() => setShowGamePicker(!showGamePicker)}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 rounded-xl px-3 py-2 hover:bg-gray-100 transition-colors"
            >
              {selectedMeta.name}
              <ChevronDown size={12} />
            </button>
            {showGamePicker && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-lg border border-gray-100 z-20 min-w-[160px] overflow-hidden">
                {GAMES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => { setSelectedGame(g.id); setShowGamePicker(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                      g.id === selectedGame ? 'font-semibold text-gray-900 bg-gray-50' : 'text-gray-600'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={selectedMeta.color}
                strokeWidth={2.5}
                dot={{ fill: selectedMeta.color, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: selectedMeta.color }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-sm text-gray-400">
            {selectedStats.totalPlays === 0
              ? `Play ${selectedMeta.name} to see your progress`
              : 'Play more rounds to see trends'}
          </div>
        )}
      </motion.div>

      {/* Streak info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-5"
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">🔥</div>
          <div>
            <div className="font-bold text-gray-900">
              {streak.current} day streak
            </div>
            <div className="text-sm text-gray-500">
              Longest: {streak.longest} days · Keep training daily!
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
