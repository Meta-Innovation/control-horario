import { TimeEntry, TimeEntryType, DailySummary } from '@/types/time-entry'
import { formatDateForDatabase } from '@/lib/date-utils'
import { supabase } from './supabase'
import { ensureDate } from './utils';

// Función para convertir los datos de la respuesta de Supabase a TimeEntry
const mapTimeEntry = (entry: any): TimeEntry => ({
  id: entry.id,
  userId: entry.user_id,
  type: entry.type as TimeEntryType,
  timestamp: entry.timestamp || new Date().toISOString(),
  notes: entry.notes,
})

// Función para convertir los datos de la respuesta de Supabase a DailySummary
const mapDailySummary = (summary: any): DailySummary => {
  // Asegurarse de que todos los campos necesarios existen
  if (!summary) return null as any;
  
  return {
    id: summary.id,
    userId: summary.user_id,
    date: ensureDate(summary.date),
    totalTime: summary.total_time || 0,
    startTime: ensureDate(summary.start_time),
    endTime: ensureDate(summary.end_time),
    breaksCount: summary.breaks_count || 0,
    breaksTime: summary.breaks_time || 0,
    // Estos campos no están en la interfaz DailySummary pero los guardamos como datos adicionales
    // para evitar errores de typescript, no los incluimos en el objeto retornado
    // pauseCafeTime: summary.pause_cafe_time || 0,
    // pausaComidaTime: summary.pause_comida_time || 0,
    // otrosTime: summary.otros_time || 0,
    createdAt: ensureDate(summary.created_at),
    updatedAt: ensureDate(summary.updated_at),
  };
};

// Crear una entrada de tiempo en el lado del servidor
export async function createTimeEntryServer(
  userId: string,
  type: TimeEntryType,
  timestamp: Date = new Date(),
  notes?: string
): Promise<TimeEntry | null> {
  
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

  return (data || []).map(mapTimeEntry)
}

// Obtener las entradas de tiempo de un día específico en el lado del cliente
export function getDailyEntriesClient(
  date: Date = new Date()
): Promise<TimeEntry[]> {
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
  const dateStr = formatDateForDatabase(date)
  
  const { data, error } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .single()

  if (error && error.code !== 'PGRST116') { // No single result error
    console.error('Error getting daily summary:', error)
    return null
  }

  return data ? mapDailySummary(data) : null
}

// Obtener el resumen diario de un día específico en el lado del cliente
export function getDailySummaryClient(
  date: Date = new Date()
): Promise<DailySummary | null> {
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
