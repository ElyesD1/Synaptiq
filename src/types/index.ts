export interface GameSession {
  id: string
  date: string
  score: number
  level?: number
  accuracy?: number
  reactionTime?: number
  duration: number
}

export interface GameStats {
  sessions: GameSession[]
  personalBest: number
  totalPlays: number
  lastPlayed?: string
}

export interface StreakData {
  current: number
  longest: number
  lastPlayDate: string
}

export type GameId =
  | 'memory-matrix'
  | 'aim-training'
  | 'digit-span'
  | 'reaction-time'
  | 'mental-math'
  | 'stroop'
  | 'sequence-memory'
  | 'pattern-recognition'

export interface GameMeta {
  id: GameId
  name: string
  description: string
  category: string
  estimatedMinutes: number
  scoreLabel: string
  color: string
  bgClass: string
  icon: string
}

export interface GameResultData {
  score: number
  level?: number
  accuracy?: number
  reactionTime?: number
  duration: number
  label: string
  sublabel?: string
}
