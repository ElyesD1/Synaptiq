export type Shape = 'circle' | 'square' | 'triangle' | 'diamond'
export type Fill = 'filled' | 'outline'

export interface Cell {
  shape: Shape
  fill: Fill
  count: 1 | 2 | 3
}

export interface PatternPuzzle {
  id: number
  cells: Cell[] // 8 visible cells (indices 0–7), 9th is answer
  options: Cell[] // 4 options
  correct: 0 | 1 | 2 | 3
  difficulty: 'easy' | 'medium' | 'hard'
  rule: string
}

const c = (shape: Shape, fill: Fill, count: 1 | 2 | 3): Cell => ({ shape, fill, count })
const f = (shape: Shape) => c(shape, 'filled', 1)
const o = (shape: Shape) => c(shape, 'outline', 1)
const fn = (shape: Shape, n: 1 | 2 | 3) => c(shape, 'filled', n)
const on_ = (shape: Shape, n: 1 | 2 | 3) => c(shape, 'outline', n)

export const PATTERNS: PatternPuzzle[] = [
  // 1. Count increases L→R
  {
    id: 1,
    cells: [
      fn('circle', 1), fn('circle', 2), fn('circle', 3),
      fn('square', 1), fn('square', 2), fn('square', 3),
      fn('triangle', 1), fn('triangle', 2),
    ],
    options: [fn('triangle', 3), fn('triangle', 1), fn('circle', 3), fn('triangle', 2)],
    correct: 0,
    difficulty: 'easy',
    rule: 'Count increases 1→2→3 left to right in each row.',
  },

  // 2. Shape cycles row by row (Latin square)
  {
    id: 2,
    cells: [
      f('circle'), f('square'), f('triangle'),
      f('square'), f('triangle'), f('circle'),
      f('triangle'), f('circle'),
    ],
    options: [f('circle'), f('square'), f('triangle'), f('diamond')],
    correct: 1,
    difficulty: 'easy',
    rule: 'Each shape appears exactly once in every row and column.',
  },

  // 3. Filled follows main diagonal
  {
    id: 3,
    cells: [
      f('circle'), o('circle'), o('circle'),
      o('circle'), f('circle'), o('circle'),
      o('circle'), o('circle'),
    ],
    options: [o('circle'), f('circle'), f('square'), o('square')],
    correct: 1,
    difficulty: 'easy',
    rule: 'Only the diagonal cells are filled. The rest are outlines.',
  },

  // 4. Count decreases top→bottom
  {
    id: 4,
    cells: [
      fn('circle', 3), fn('square', 3), fn('triangle', 3),
      fn('circle', 2), fn('square', 2), fn('triangle', 2),
      fn('circle', 1), fn('square', 1),
    ],
    options: [fn('triangle', 1), fn('triangle', 2), fn('triangle', 3), fn('circle', 1)],
    correct: 0,
    difficulty: 'easy',
    rule: 'Count decreases from 3 to 1 going top to bottom.',
  },

  // 5. Checkerboard fill
  {
    id: 5,
    cells: [
      f('circle'), o('circle'), f('circle'),
      o('circle'), f('circle'), o('circle'),
      f('circle'), o('circle'),
    ],
    options: [o('circle'), f('circle'), f('square'), o('square')],
    correct: 1,
    difficulty: 'medium',
    rule: 'Filled and outline alternate in a checkerboard pattern.',
  },

  // 6. Anti-diagonal fill
  {
    id: 6,
    cells: [
      o('diamond'), o('diamond'), f('diamond'),
      o('diamond'), f('diamond'), o('diamond'),
      f('diamond'), o('diamond'),
    ],
    options: [f('diamond'), o('diamond'), f('circle'), o('circle')],
    correct: 1,
    difficulty: 'medium',
    rule: 'Only the anti-diagonal cells are filled.',
  },

  // 7. Latin square count + shape progression
  {
    id: 7,
    cells: [
      fn('circle', 1), fn('square', 1), fn('triangle', 1),
      fn('square', 2), fn('triangle', 2), fn('circle', 2),
      fn('triangle', 3), fn('circle', 3),
    ],
    options: [fn('square', 3), fn('square', 1), fn('triangle', 3), fn('circle', 3)],
    correct: 0,
    difficulty: 'hard',
    rule: 'Shape follows a Latin square; count increases by row.',
  },

  // 8. Outline/fill flip per row
  {
    id: 8,
    cells: [
      f('circle'), on_('circle', 2), fn('circle', 3),
      on_('circle', 1), fn('circle', 2), on_('circle', 3),
      f('circle'), on_('circle', 2),
    ],
    options: [fn('circle', 3), on_('circle', 3), f('circle'), on_('circle', 1)],
    correct: 0,
    difficulty: 'medium',
    rule: 'Fill alternates per row; count increases left to right.',
  },

  // 9. Shape and count in combined Latin square
  {
    id: 9,
    cells: [
      fn('circle', 1), fn('square', 2), fn('triangle', 3),
      fn('square', 3), fn('triangle', 1), fn('circle', 2),
      fn('triangle', 2), fn('circle', 3),
    ],
    options: [fn('square', 1), fn('square', 2), fn('square', 3), fn('circle', 1)],
    correct: 0,
    difficulty: 'hard',
    rule: 'Shape and count each form a Latin square independently.',
  },

  // 10. Size proxy: filled vs outline with count as size
  {
    id: 10,
    cells: [
      fn('diamond', 1), on_('diamond', 2), fn('diamond', 3),
      on_('diamond', 3), fn('diamond', 1), on_('diamond', 2),
      fn('diamond', 2), on_('diamond', 3),
    ],
    options: [fn('diamond', 1), on_('diamond', 1), fn('diamond', 2), on_('diamond', 3)],
    correct: 0,
    difficulty: 'hard',
    rule: 'Count and fill each follow a Latin square pattern.',
  },
]
