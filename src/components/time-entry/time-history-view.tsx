import { useState } from "react"
import { addDays, subDays, format, startOfWeek, endOfWeek } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn, ensureDate } from "@/lib/utils"
import { useHistoricalTimeEntries } from "@/hooks/use-historical-time-entries"
import { TimeHistoryList } from "@/components/time-entry/time-history-list"

export function TimeHistoryView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day")
  
  const { 
    entries, 
    summaries, 
    isLoading,
    error
  } = useHistoricalTimeEntries(selectedDate, viewMode)
  
  // Navegar entre días/semanas/meses
  const handleNavigatePrev = () => {
    if (viewMode === "day") {
      setSelectedDate(subDays(selectedDate, 1))
    } else if (viewMode === "week") {
      setSelectedDate(subDays(selectedDate, 7))
    } else {
      const prevMonth = new Date(selectedDate)
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      setSelectedDate(prevMonth)
    }
  }
  
  const handleNavigateNext = () => {
    if (viewMode === "day") {
      setSelectedDate(addDays(selectedDate, 1))
    } else if (viewMode === "week") {
      setSelectedDate(addDays(selectedDate, 7))
    } else {
      const nextMonth = new Date(selectedDate)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      setSelectedDate(nextMonth)
    }
  }
  
  // Formatear el rango de fechas para el título
  const getDateRangeTitle = () => {
    if (viewMode === "day") {
      return format(selectedDate, "d 'de' MMMM yyyy", { locale: es })
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(selectedDate, { locale: es })
      const weekEnd = endOfWeek(selectedDate, { locale: es })
      return `${format(weekStart, "d MMM", { locale: es })} - ${format(weekEnd, "d MMM yyyy", { locale: es })}`
    } else {
      return format(selectedDate, "MMMM yyyy", { locale: es })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Historial de Tiempo</CardTitle>
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal w-[240px]",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={viewMode} onValueChange={(value) => setViewMode(value as "day" | "week" | "month")}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ver por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Día</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" size="icon" onClick={handleNavigatePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-medium">{getDateRangeTitle()}</h3>
            <Button variant="ghost" size="icon" onClick={handleNavigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              Error al cargar los registros
            </div>
          ) : (
            <div className="space-y-8">
              {summaries.length > 0 ? (
                summaries.map((summary) => (
                  <TimeHistoryList 
                    key={summary.date.toISOString()} 
                    date={summary.date}
                    entries={entries.filter(entry => 
                      ensureDate(entry.timestamp).toDateString() === summary.date.toDateString()
                    )}
                    summary={summary}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No hay registros para el período seleccionado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Generated by Copilot
