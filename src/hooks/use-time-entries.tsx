import { useState, useCallback, useEffect } from "react";
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
import { useAuth } from "@/components/providers/auth-provider";
import { ensureDate } from "@/lib/utils";

export function useTimeEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [todaySummary, setTodaySummary] =
    useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener la entrada "activa" (la última entrada o pausa registrada)
  const activeEntry =
    entries.length > 0
      ? entries
          .sort(
            (a, b) =>
              ensureDate(b.timestamp).getTime() -
              ensureDate(a.timestamp).getTime()
          )
          .find(
            entry =>
              entry.type === "entrada" ||
              entry.type.startsWith("pausa")
          )
      : null;

  // Función para refrescar las entradas del día
  const refreshEntries = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Obtener entradas y resumen
      const entriesData = await getDailyEntriesClient();
      const summaryData = await getDailySummaryClient();

      // Ordenar por timestamp (las más recientes primero)
      setEntries(
        entriesData.sort(
          (a, b) =>
            ensureDate(b.timestamp).getTime() -
            ensureDate(a.timestamp).getTime()
        )
      );
      setTodaySummary(summaryData);
      setError(null);
    } catch (err) {
      console.error("Error fetching time entries:", err);
      setError("Error al cargar los registros de tiempo");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Función para añadir una nueva entrada
  const addEntry = useCallback(
    async (type: TimeEntryType, notes?: string) => {
      if (!user) return null;

      setIsLoading(true);
      try {
        const newEntry = await createTimeEntryClient(
          type,
          new Date(),
          notes
        );

        if (newEntry) {
          // Actualizar las entradas y el resumen
          await refreshEntries();
        }

        return newEntry;
      } catch (err) {
        console.error("Error creating time entry:", err);
        setError("Error al guardar el registro de tiempo");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user, refreshEntries]
  );

  // Cargar las entradas al inicializar
  useEffect(() => {
    if (user) {
      refreshEntries();
    }
  }, [user, refreshEntries]);

  return {
    entries,
    todaySummary,
    activeEntry,
    isLoading,
    error,
    addEntry,
    refreshEntries,
  };
}

// Generated by Copilot
