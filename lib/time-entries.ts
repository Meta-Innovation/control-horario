import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { TimeEntry, TimeEntryType, DailyTimeRecord, DailySummary } from '@/types/time-entry'
import { formatDateForDatabase } from '@/lib/date-utils'

// Función para convertir los datos de la respuesta de Supabase a TimeEntry
const mapTimeEntry = (entry: any): TimeEntry => ({
  id: entry.id,
  userId: entry.user_id,
  type: entry.type as TimeEntryType,
  timestamp: new Date(entry.timestamp),
  notes: entry.notes,
  createdAt: new Date(entry.created_at),
})

// Función para convertir los datos de la respuesta de Supabase a DailySummary
const mapDailySummary = (summary: any): DailySummary => ({
  id: summary.id,
  userId: summary.user_id,
  date: new Date(summary.date),
  totalTime: summary.total_time,
  startTime: summary.start_time ? new Date(summary.start_time) : null,
  endTime: summary.end_time ? new Date(summary.end_time) : null,
  breaksCount: summary.breaks_count,
  breaksTime: summary.breaks_time,
  createdAt: new Date(summary.created_at),
  updatedAt: new Date(summary.updated_at),
})

// Crear una entrada de tiempo en el lado del servidor
export async function createTimeEntryServer(
  userId: string,
  type: TimeEntryType,
  timestamp: Date = new Date(),
  notes?: string
): Promise<TimeEntry | null> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      user_id: userId,
      type,
      timestamp: timestamp.toISOString(),
      notes
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating time entry:', error)
    return null
  }

  return mapTimeEntry(data)
}

// Crear una entrada de tiempo en el lado del cliente
export function createTimeEntryClient(
  type: TimeEntryType,
  timestamp: Date = new Date(),
  notes?: string
): Promise<TimeEntry | null> {
  const supabase = createBrowserClient()
  
  return supabase.auth.getUser()
    .then(({ data }) => {
      if (!data.user) throw new Error('Usuario no autenticado')
      
      return supabase
        .from('time_entries')
        .insert({
          user_id: data.user.id,
          type,
          timestamp: timestamp.toISOString(),
          notes
        })
        .select()
        .single()
    })
    .then(({ data, error }) => {
      if (error) {
        console.error('Error creating time entry:', error)
        return null
      }
      return mapTimeEntry(data)
    })
    .catch(error => {
      console.error('Error in createTimeEntryClient:', error)
      return null
    })
}

// Obtener las entradas de tiempo de un día específico en el lado del servidor
export async function getDailyEntriesServer(
  userId: string,
  date: Date = new Date()
): Promise<TimeEntry[]> {
  const supabase = await createServerClient()
  const dateStr = formatDateForDatabase(date)
  
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', `${dateStr}T00:00:00Z`)
    .lt('timestamp', `${dateStr}T23:59:59Z`)
    .order('timestamp', { ascending: true })

  if (error) {
    console.error('Error getting daily entries:', error)
    return []
  }

  return data.map(mapTimeEntry)
}

// Obtener las entradas de tiempo de un día específico en el lado del cliente
export function getDailyEntriesClient(
  date: Date = new Date()
): Promise<TimeEntry[]> {
  const supabase = createBrowserClient()
  const dateStr = formatDateForDatabase(date)
  
  return supabase.auth.getUser()
    .then(({ data }) => {
      if (!data.user) throw new Error('Usuario no autenticado')
      
      return supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', data.user.id)
        .gte('timestamp', `${dateStr}T00:00:00Z`)
        .lt('timestamp', `${dateStr}T23:59:59Z`)
        .order('timestamp', { ascending: true })
    })
    .then(({ data, error }) => {
      if (error) {
        console.error('Error getting daily entries:', error)
        return []
      }
      return (data || []).map(mapTimeEntry)
    })
    .catch(error => {
      console.error('Error in getDailyEntriesClient:', error)
      return []
    })
}

// Obtener el resumen diario de un día específico en el lado del servidor
export async function getDailySummaryServer(
  userId: string,
  date: Date = new Date()
): Promise<DailySummary | null> {
  const supabase = await createServerClient()
  const dateStr = formatDateForDatabase(date)
  
  const { data, error } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .single()

  if (error) {
    console.error('Error getting daily summary:', error)
    return null
  }

  return mapDailySummary(data)
}

// Obtener el resumen diario de un día específico en el lado del cliente
export function getDailySummaryClient(
  date: Date = new Date()
): Promise<DailySummary | null> {
  const supabase = createBrowserClient()
  const dateStr = formatDateForDatabase(date)
  
  return supabase.auth.getUser()
    .then(({ data }) => {
      if (!data.user) throw new Error('Usuario no autenticado')
      
      return supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('date', dateStr)
        .single()
    })
    .then(({ data, error }) => {
      if (error && error.code !== 'PGRST116') { // No single result error
        console.error('Error getting daily summary:', error)
        return null
      }
      return data ? mapDailySummary(data) : null
    })
    .catch(error => {
      console.error('Error in getDailySummaryClient:', error)
      return null
    })
}

// Generated by Copilot
