import {
  TimeEntry,
  TimeEntryType,
  DailySummary,
} from "@/types/time-entry";
import {
  createTimeEntryClient,
  getDailyEntriesClient,
  getDailySummaryClient,
} from "@/lib/time-entries";
import { formatDateForDatabase } from "@/lib/date-utils";
import { supabase } from "./supabase";
import { ensureDate } from "./utils";

// Función auxiliar para mapear entradas (exportada para uso externo)
export function mapTimeEntryToClient(entry: any): TimeEntry {
  return {
    id: entry.id,
    userId: entry.user_id,
    type: entry.type as TimeEntryType,
    timestamp: entry.timestamp,
    notes: entry.notes,
    ...(entry.workday_id && { workdayId: entry.workday_id }),
  };
}

class TimeEntryService {
  // Singleton instance
  private static instance: TimeEntryService;

  // Cache para entradas del día actual
  private todayEntriesCache: TimeEntry[] = [];
  private todaySummaryCache: DailySummary | null = null;
  private lastRefreshTime: Date | null = null;

  // Constructor privado para el patrón singleton
  private constructor() {}

  // Obtener la instancia singleton
  public static getInstance(): TimeEntryService {
    if (!TimeEntryService.instance) {
      TimeEntryService.instance = new TimeEntryService();
    }
    return TimeEntryService.instance;
  }

  // Registrar una nueva entrada de tiempo
  public async registerTimeEntry(
    type: TimeEntryType,
    notes?: string
  ): Promise<TimeEntry | null> {
    try {
      const entry = await createTimeEntryClient(
        type,
        new Date(),
        notes
      );

      if (entry) {
        // Actualizar caché y notificar suscriptores
        await this.refreshTodayData(true);
      }

      return entry;
    } catch (error) {
      console.error("Error registering time entry:", error);
      throw error;
    }
  }

  // Refrescar datos del día actual
  public async refreshTodayData(
    force: boolean = false
  ): Promise<{
    entries: TimeEntry[];
    summary: DailySummary | null;
  }> {
    // Si los datos son recientes (menos de 10 segundos) y no se fuerza la actualización, usar caché
    if (
      !force &&
      this.lastRefreshTime &&
      new Date().getTime() -
        this.lastRefreshTime.getTime() <
        10000
    ) {
      return {
        entries: this.todayEntriesCache,
        summary: this.todaySummaryCache,
      };
    }

    try {
      // Obtener datos frescos
      const entries = await getDailyEntriesClient();
      const summary = await getDailySummaryClient();

      // Actualizar caché
      this.todayEntriesCache = entries;
      this.todaySummaryCache = summary;
      this.lastRefreshTime = new Date();

      return { entries, summary };
    } catch (error) {
      console.error(
        "Error refreshing today's data:",
        error
      );

      // En caso de error, devolver lo que tengamos en caché
      return {
        entries: this.todayEntriesCache,
        summary: this.todaySummaryCache,
      };
    }
  }

  // Obtener el estado actual de trabajo
  public getWorkdayStatus(entries: TimeEntry[]): {
    isActive: boolean;
    latestEntry: TimeEntry | null;
    hasCheckIn: boolean;
    hasCheckOut: boolean;
    activePauses: {
      pausaCafe: boolean;
      pausaComida: boolean;
      otros: boolean;
    };
  } {
    if (!entries.length) {
      return {
        isActive: false,
        latestEntry: null,
        hasCheckIn: false,
        hasCheckOut: false,
        activePauses: {
          pausaCafe: false,
          pausaComida: false,
          otros: false,
        }
      };
    }

    // Ordenar entradas por timestamp (más recientes primero)
    const sortedEntries = [...entries].sort(
      (a, b) =>
        ensureDate(b.timestamp).getTime() -
        ensureDate(a.timestamp).getTime()
    );

    const latestEntry = sortedEntries[0];
    const hasCheckIn = entries.some(
      entry => entry.type === "entrada"
    );
    const hasCheckOut = entries.some(
      entry => entry.type === "salida"
    );

    // Detectar pausas activas
    const hasActiveCoffeePause = entries.some(entry => entry.type === "inicioPausaCafe") && 
      !entries.some(entry => entry.type === "finPausaCafe" && 
      ensureDate(entry.timestamp).getTime() > ensureDate(entries.find(e => e.type === "inicioPausaCafe")?.timestamp || "").getTime());
    
    const hasActiveLunchPause = entries.some(entry => entry.type === "inicioPausaComida") && 
      !entries.some(entry => entry.type === "finPausaComida" && 
      ensureDate(entry.timestamp).getTime() > ensureDate(entries.find(e => e.type === "inicioPausaComida")?.timestamp || "").getTime());
    
    const hasActiveOtherPause = entries.some(entry => entry.type === "inicioOtros") && 
      !entries.some(entry => entry.type === "finOtros" && 
      ensureDate(entry.timestamp).getTime() > ensureDate(entries.find(e => e.type === "inicioOtros")?.timestamp || "").getTime());

    // La jornada está activa si hay entrada pero no salida
    const isActive = hasCheckIn && !hasCheckOut;

    return {
      isActive,
      latestEntry,
      hasCheckIn,
      hasCheckOut,
      activePauses: {
        pausaCafe: hasActiveCoffeePause,
        pausaComida: hasActiveLunchPause,
        otros: hasActiveOtherPause,
      }
    };
  }

  // Obtener entradas agrupadas por día para visualización de historial
  public async getEntriesByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, TimeEntry[]>> {
    try {
      const { data: userData } =
        await supabase.auth.getUser();
      if (!userData.user)
        throw new Error("Usuario no autenticado");

      const startDateStr = formatDateForDatabase(startDate);
      const endDateStr = formatDateForDatabase(endDate);

      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", userData.user.id)
        .gte("timestamp", `${startDateStr}T00:00:00Z`)
        .lte("timestamp", `${endDateStr}T23:59:59Z`)
        .order("timestamp", { ascending: true });

      if (error) throw error;

      // Agrupar por fecha
      const entriesByDate: Record<string, TimeEntry[]> = {};

      (data || []).forEach(entry => {
        const entryDate = ensureDate(entry.timestamp);
        const dateStr = formatDateForDatabase(entryDate);

        if (!entriesByDate[dateStr]) {
          entriesByDate[dateStr] = [];
        }

        // Usar la función exportada para mantener consistencia
        entriesByDate[dateStr].push(mapTimeEntryToClient(entry));
      });

      return entriesByDate;
    } catch (error) {
      console.error(
        "Error getting entries by date range:",
        error
      );
      return {};
    }
  }
}

// Exportar la instancia singleton
export const timeEntryService = TimeEntryService.getInstance();

// Generated by Copilot
