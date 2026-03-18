import { useState, useEffect } from 'react'

/** Cycles through demo frames on a per-step timer. Loops forever. */
export function useDemoStep(durations: number[]): number {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setTimeout(
      () => setStep((s) => (s + 1) % durations.length),
      durations[step] ?? 1500,
    )
    return () => clearTimeout(t)
  }, [step]) // eslint-disable-line
  return step
}
