import { DailySummary } from "@/types/time-entry"
import { formatElapsedTimeFromSeconds, formatTime } from "@/lib/date-utils"

interface TimeStatsProps {
  summary: DailySummary | null
}

export function TimeStats({ summary }: TimeStatsProps) {
  if (!summary) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No hay estadísticas disponibles para hoy
      </div>
    )
  }

  const stats = [
    {
      label: "Tiempo total trabajado",
      value: formatElapsedTimeFromSeconds(summary.totalTime),
      description: "Excluye pausas registradas"
    },
    {
      label: "Hora de entrada",
      value: summary.startTime ? formatTime(summary.startTime) : "—",
    },
    {
      label: "Hora de salida",
      value: summary.endTime ? formatTime(summary.endTime) : "—",
    },
    {
      label: "Número de pausas",
      value: summary.breaksCount.toString(),
    },
    {
      label: "Tiempo en pausas",
      value: formatElapsedTimeFromSeconds(summary.breaksTime),
    }
  ]

  return (
    <div className="space-y-4">
      {stats.map((stat, index) => (
        <div key={index} className="flex justify-between border-b pb-2">
          <div>
            <div className="font-medium">{stat.label}</div>
            {stat.description && (
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            )}
          </div>
          <div className="font-mono">{stat.value}</div>
        </div>
      ))}
    </div>
  )
}

// Generated by Copilot
