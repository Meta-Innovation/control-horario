import { useState, useEffect, useCallback } from "react"
import { formatElapsedTimeFromSeconds } from "@/lib/date-utils"

interface UseTimerOptions {
  autoStart?: boolean
  interval?: number
  onTick?: (secondsElapsed: number) => void
}

export function useTimer(startTime: Date | null, options: UseTimerOptions = {}) {
  const { 
    autoStart = true, 
    interval = 1000,
    onTick
  } = options
  
  const [isRunning, setIsRunning] = useState(autoStart && !!startTime)
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [formattedTime, setFormattedTime] = useState("00:00:00")

  // Calcular tiempo transcurrido entre startTime y ahora
  const calculateElapsed = useCallback(() => {
    if (!startTime) return 0
    
    const now = new Date()
    return Math.floor((now.getTime() - startTime.getTime()) / 1000)
  }, [startTime])

  // Actualizar formattedTime cuando secondsElapsed cambie
  useEffect(() => {
    setFormattedTime(formatElapsedTimeFromSeconds(secondsElapsed))
  }, [secondsElapsed])

  // Inicializar y configurar el intervalo para la actualización
  useEffect(() => {
    // Si no hay startTime o el timer no está corriendo, no hacer nada
    if (!startTime || !isRunning) {
      setSecondsElapsed(0)
      setFormattedTime("00:00:00")
      return
    }
    
    // Calcular y establecer el tiempo inicial
    const initialSeconds = calculateElapsed()
    setSecondsElapsed(initialSeconds)
    
    // Configurar el intervalo para actualizar cada segundo
    const timerInterval = setInterval(() => {
      const newSeconds = calculateElapsed()
      setSecondsElapsed(newSeconds)
      
      if (onTick) onTick(newSeconds)
    }, interval)
    
    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(timerInterval)
  }, [startTime, isRunning, calculateElapsed, interval, onTick])
  
  // Funciones para controlar el timer
  const start = useCallback(() => setIsRunning(true), [])
  const stop = useCallback(() => setIsRunning(false), [])
  const reset = useCallback(() => {
    setIsRunning(false)
    setSecondsElapsed(0)
    setFormattedTime("00:00:00")
  }, [])
  
  return {
    isRunning,
    secondsElapsed,
    formattedTime,
    start,
    stop,
    reset
  }
}

// Generated by Copilot
