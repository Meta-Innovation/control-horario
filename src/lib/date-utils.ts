/**
 * Formatea una fecha para mostrar en la interfaz de usuario
 * @param date Fecha a formatear
 * @returns Cadena de fecha formateada (ej: "01/07/2023")
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formatea una fecha para usar en consultas de base de datos
 * @param date Fecha a formatear
 * @returns Cadena de fecha en formato ISO (ej: "2023-07-01")
 */
export function formatDateForDatabase(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Formatea una hora para mostrar en la interfaz de usuario
 * @param date Fecha/hora a formatear
 * @returns Cadena de hora formateada (ej: "14:30:25")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Formatea tiempo transcurrido en segundos a formato HH:MM:SS
 * @param seconds Tiempo en segundos
 * @returns Cadena formateada (ej: "01:30:45")
 */
export function formatElapsedTimeFromSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Calcula el tiempo transcurrido entre dos fechas
 * @param startTime Fecha/hora de inicio
 * @param endTime Fecha/hora de fin (por defecto: ahora)
 * @returns Cadena de tiempo transcurrido en formato HH:MM:SS
 */
export function formatElapsedTime(startTime: Date, endTime: Date = new Date()): string {
  const diffInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
  return formatElapsedTimeFromSeconds(diffInSeconds)
}

/**
 * Verifica si dos fechas son del mismo día
 * @param date1 Primera fecha
 * @param date2 Segunda fecha
 * @returns true si son del mismo día, false en caso contrario
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

// Generated by Copilot
