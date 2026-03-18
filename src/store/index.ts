import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameSession, GameStats, StreakData, GameId } from '../types'

interface AppState {
  playerName: string
  streak: StreakData
  games: Partial<Record<GameId, GameStats>>
  totalGamesPlayed: number

  setPlayerName: (name: string) => void
  recordSession: (gameId: GameId, session: Omit<GameSession, 'id' | 'date'>) => void
  updateStreak: () => void
  getGameStats: (gameId: GameId) => GameStats
}

const defaultStats: GameStats = {
  sessions: [],
  personalBest: 0,
  totalPlays: 0,
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      playerName: 'Elyes',
      streak: { current: 0, longest: 0, lastPlayDate: '' },
      games: {},
      totalGamesPlayed: 0,

      setPlayerName: (name) => set({ playerName: name }),

      recordSession: (gameId, sessionData) => {
        const session: GameSession = {
          id: `${gameId}-${Date.now()}`,
          date: new Date().toISOString(),
          ...sessionData,
        }
        set((state) => {
          const current = state.games[gameId] ?? { ...defaultStats, sessions: [] }
          return {
            games: {
              ...state.games,
              [gameId]: {
                sessions: [session, ...current.sessions].slice(0, 50),
                personalBest: Math.max(current.personalBest, session.score),
                totalPlays: current.totalPlays + 1,
                lastPlayed: session.date,
              },
            },
            totalGamesPlayed: state.totalGamesPlayed + 1,
          }
        })
        get().updateStreak()
      },

      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0]
        set((state) => {
          const last = state.streak.lastPlayDate
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          const newCurrent =
            last === today ? state.streak.current : last === yesterday ? state.streak.current + 1 : 1
          return {
            streak: {
              current: newCurrent,
              longest: Math.max(state.streak.longest, newCurrent),
              lastPlayDate: today,
            },
          }
        })
      },

      getGameStats: (gameId) => get().games[gameId] ?? { ...defaultStats, sessions: [] },
    }),
    { name: 'apex-store-v1' },
  ),
)
