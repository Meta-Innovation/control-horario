import { useState } from "react"
import { 
  Calendar, 
  Clock, 
  Coffee, 
  DoorOpen, 
  LogOut, 
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TimeEntry, TimeEntryType, DailySummary } from "@/types/time-entry"
import { formatDate, formatTime, formatElapsedTimeFromSeconds } from "@/lib/date-utils"

interface TimeHistoryListProps {
  date: Date
  entries: TimeEntry[]
  summary: DailySummary | null
}

// Mapeo de tipos de entrada a iconos y estilos
const entryTypeInfo: Record<TimeEntryType, { 
  icon: React.ReactNode, 
  label: string, 
  variant: "default" | "secondary" | "outline" | "destructive" 
}> = {
  "entrada": { 
    icon: <DoorOpen className="h-4 w-4 mr-1" />, 
    label: "Entrada", 
    variant: "default" 
  },
  "pausaCafe": { 
    icon: <Coffee className="h-4 w-4 mr-1" />, 
    label: "Pausa Café", 
    variant: "secondary" 
  },
  "pausaComida": { 
    icon: <MoreHorizontal className="h-4 w-4 mr-1" />, 
    label: "Pausa Comida", 
    variant: "secondary" 
  },
  "otros": { 
    icon: <MoreHorizontal className="h-4 w-4 mr-1" />, 
    label: "Otros", 
    variant: "outline" 
  },
  "salida": { 
    icon: <LogOut className="h-4 w-4 mr-1" />, 
    label: "Salida", 
    variant: "destructive" 
  },
}

export function TimeHistoryList({ date, entries, summary }: TimeHistoryListProps) {
  const [expanded, setExpanded] = useState(false)
  
  // No hay entradas para este día
  if (entries.length === 0) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">{formatDate(date)}</span>
            </div>
            <span className="text-sm text-muted-foreground">Sin registros</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Ordenar entradas por hora (más temprano primero)
  const sortedEntries = [...entries].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  )

  return (
    <Card>
      <CardContent className="p-4">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">{formatDate(date)}</span>
          </div>
          <div className="flex items-center space-x-4">
            {summary && (
              <span className="text-sm font-mono">
                {formatElapsedTimeFromSeconds(summary.totalTime)}
              </span>
            )}
            {expanded ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </div>
        </Button>
        
        {expanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            {/* Resumen */}
            {summary && (
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Entrada:</span>
                    <span className="font-mono">
                      {summary.startTime ? formatTime(summary.startTime) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Salida:</span>
                    <span className="font-mono">
                      {summary.endTime ? formatTime(summary.endTime) : "—"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pausas:</span>
                    <span className="font-mono">{summary.breaksCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tiempo total:</span>
                    <span className="font-mono">
                      {formatElapsedTimeFromSeconds(summary.totalTime)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de entradas */}
            <div className="space-y-2">
              {sortedEntries.map((entry) => {
                const { icon, label, variant } = entryTypeInfo[entry.type]
                
                return (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-2 rounded-md bg-accent/20"
                  >
                    <div className="flex items-center">
                      <Badge variant={variant} className="flex items-center mr-2">
                        {icon}
                        {label}
                      </Badge>
                      {entry.notes && (
                        <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {entry.notes}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-xs font-mono">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Generated by Copilot
