import {
  TimeEntry,
  TimeEntryType,
} from "@/types/time-entry";
import { formatTime } from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ensureDate } from "@/lib/utils";

interface EntryHistoryListProps {
  entries: TimeEntry[];
}

// Mapeo de tipos de entrada a textos descriptivos y colores de badge
const entryTypeInfo: Record<
  TimeEntryType,
  {
    label: string;
    variant:
      | "default"
      | "secondary"
      | "outline"
      | "destructive";
  }
> = {
  entrada: { label: "Entrada", variant: "default" },
  salida: { label: "Salida", variant: "destructive" },

  // Inicio y fin de pausas de café
  inicioPausaCafe: {
    label: "Inicio Pausa Café",
    variant: "secondary",
  },
  finPausaCafe: {
    label: "Fin Pausa Café",
    variant: "outline",
  },

  // Inicio y fin de pausas para comida
  inicioPausaComida: {
    label: "Inicio Pausa Comida",
    variant: "secondary",
  },
  finPausaComida: {
    label: "Fin Pausa Comida",
    variant: "outline",
  },

  // Inicio y fin de otras pausas
  inicioOtros: {
    label: "Inicio Otra Pausa",
    variant: "secondary",
  },
  finOtros: { label: "Fin Otra Pausa", variant: "outline" },
};

export function EntryHistoryList({
  entries,
}: EntryHistoryListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No hay registros para hoy
      </div>
    );
  }

  // Ordenar por timestamp descendente (más reciente primero)
  const sortedEntries = [...entries].sort(
    (a, b) =>
      ensureDate(b.timestamp).getTime() -
      ensureDate(a.timestamp).getTime()
  );

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-3">
        {sortedEntries.map(entry => {
          // Verificar que el tipo existe en nuestro mapeo
          const typeInfo =
            entryTypeInfo[entry.type as TimeEntryType];

          if (!typeInfo) {
            console.warn(
              `Tipo de entrada desconocido: ${entry.type}`
            );
            return null;
          }

          const { label, variant } = typeInfo;

          return (
            <div
              key={entry.id}
              className="flex items-center justify-between border-b pb-2"
            >
              <div className="flex items-center space-x-3">
                <Badge variant={variant}>{label}</Badge>
                {entry.notes && (
                  <span className="text-sm text-muted-foreground line-clamp-1">
                    {entry.notes}
                  </span>
                )}
              </div>
              <div className="text-sm font-mono">
                {formatTime(ensureDate(entry.timestamp))}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// Generated by Copilot
