import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(initialSeconds: number, onComplete?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const start = useCallback(() => setIsRunning(true), [])

  const stop = useCallback(() => {
    setIsRunning(false)
    clearInterval(intervalRef.current)
  }, [])

  const reset = useCallback(
    (newSeconds?: number) => {
      setIsRunning(false)
      clearInterval(intervalRef.current)
      setSeconds(newSeconds ?? initialSeconds)
    },
    [initialSeconds],
  )

  useEffect(() => {
    if (!isRunning) return
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          setIsRunning(false)
          onCompleteRef.current?.()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  return { seconds, isRunning, start, stop, reset }
}
