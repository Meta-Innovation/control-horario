import { useState, useCallback, useEffect } from "react"
import { 
  startOfDay, endOfDay, 
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  eachDayOfInterval, format,
  isSameDay
} from "date-fns"
import { es } from "date-fns/locale"
import { TimeEntry, DailySummary } from "@/types/time-entry"
import { useAuth } from "@/components/providers/auth-provider"
import { formatDateForDatabase } from "@/lib/date-utils"
import { supabase } from "@/lib/supabase"
import { ensureDate } from "@/lib/utils"

// Mapeo para convertir los datos de Supabase a objetos de la aplicación
const mapTimeEntry = (entry: any): TimeEntry => ({
  id: entry.id,
  userId: entry.user_id,
  type: entry.type,
  timestamp: entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp),
  notes: entry.notes,
  workdayId: entry.workday_id || entry.workdayId
})

const mapDailySummary = (summary: any): DailySummary => ({
  id: summary.id,
  userId: summary.user_id,
  date: summary.date instanceof Date ? summary.date : new Date(summary.date),
  totalTime: summary.total_time,
  startTime: summary.start_time ? ensureDate(summary.start_time) : null,
  endTime: summary.end_time ? ensureDate(summary.end_time) : null,
  breaksCount: summary.breaks_count,
  breaksTime: summary.breaks_time,
  createdAt: ensureDate(summary.created_at),
  updatedAt: ensureDate(summary.updated_at),
})

export function useHistoricalTimeEntries(
  selectedDate: Date,
  viewMode: "day" | "week" | "month" = "day"
) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Función para obtener el rango de fechas según el modo de visualización
  const getDateRange = useCallback(() => {
    // Asegurarnos que selectedDate es un objeto Date
    const date = ensureDate(selectedDate);
    
    if (viewMode === "day") {
      return {
        from: startOfDay(date),
        to: endOfDay(date)
      }
    } else if (viewMode === "week") {
      return {
        from: startOfWeek(date, { locale: es }),
        to: endOfWeek(date, { locale: es })
      }
    } else {
      return {
        from: startOfMonth(date),
        to: endOfMonth(date)
      }
    }
  }, [selectedDate, viewMode])
  
  // Cargar registros históricos
  const fetchHistoricalData = useCallback(async () => {
    if (!user) return
    
    const { from, to } = getDateRange()
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Obtener entradas de tiempo
      const { data: entriesData, error: entriesError } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("timestamp", from.toISOString())
        .lte("timestamp", to.toISOString())
        .order("timestamp", { ascending: true })
      
      if (entriesError) throw entriesError
      
      // Obtener resúmenes diarios
      const { data: summariesData, error: summariesError } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", formatDateForDatabase(from))
        .lte("date", formatDateForDatabase(to))
        .order("date", { ascending: true })
      
      if (summariesError) throw summariesError
      
      // Si estamos en modo mes o semana y no hay resúmenes para algunos días,
      // crear estructuras vacías para esos días
      const allDays = eachDayOfInterval({ start: from, end: to })
      
      const mappedSummaries = summariesData?.map(mapDailySummary) || []
      const mappedEntries = entriesData?.map(mapTimeEntry) || []
      
      // Asegurar que tenemos un resumen para cada día en el rango
      const completeSummaries = allDays.map(day => {
        // Buscar si hay un resumen existente para este día
        const existingSummary = mappedSummaries.find(summary => 
          isSameDay(ensureDate(summary.date), day)
        )
        
        if (existingSummary) {
          return existingSummary
        }
        
        // Si no hay entradas para este día, no incluir un resumen
        const hasEntriesForDay = mappedEntries.some(entry => 
          isSameDay(ensureDate(entry.timestamp), day)
        )
        
        if (!hasEntriesForDay) {
          return null
        }
        
        // Crear un resumen vacío para este día
        return {
          id: `empty-${format(day, "yyyy-MM-dd")}`,
          userId: user.id,
          date: day,
          totalTime: 0,
          startTime: null,
          endTime: null,
          breaksCount: 0,
          breaksTime: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }).filter(Boolean) as DailySummary[]
      
      setEntries(mappedEntries)
      setSummaries(completeSummaries)
    } catch (err) {
      console.error("Error fetching historical data:", err)
      setError("Error al cargar los datos históricos")
    } finally {
      setIsLoading(false)
    }
  }, [user, getDateRange])
  
  // Cargar datos cuando cambien los parámetros
  useEffect(() => {
    if (user) {
      fetchHistoricalData()
    }
  }, [user, selectedDate, viewMode, fetchHistoricalData])
  
  return {
    entries,
    summaries,
    isLoading,
    error,
    refresh: fetchHistoricalData
  }
}

// Generated by Copilot
