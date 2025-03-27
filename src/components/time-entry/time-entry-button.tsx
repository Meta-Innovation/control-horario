import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils";
import { PauseType, TimeEntryType } from "@/types/time-entry"
import { 
  LogIn, 
  LogOut, 
  PauseCircle,
  PlayCircle
} from "lucide-react"

interface TimeEntryButtonProps {
  type: TimeEntryType | PauseType;
  onClick: () => void;
  disabled?: boolean;
  isPauseActive?: boolean;
  className?: string;
}

export function TimeEntryButton({ 
  type, 
  onClick, 
  disabled = false,
  isPauseActive = false,
  className
}: TimeEntryButtonProps) {
  // Configuración para cada tipo de botón
  const buttonConfig = {
    entrada: {
      icon: <LogIn className="mr-2 h-4 w-4" />,
      label: "Entrada",
      variant: "default" as const,
    },
    salida: {
      icon: <LogOut className="mr-2 h-4 w-4" />,
      label: "Salida",
      variant: "destructive" as const,
    },
    pausaCafe: {
      icon: isPauseActive 
        ? <PlayCircle className="mr-2 h-4 w-4" /> 
        : <PauseCircle className="mr-2 h-4 w-4" />,
      label: isPauseActive ? "Finalizar pausa café" : "Iniciar pausa café",
      variant: "secondary" as const,
    },
    pausaComida: {
      icon: isPauseActive 
        ? <PlayCircle className="mr-2 h-4 w-4" /> 
        : <PauseCircle className="mr-2 h-4 w-4" />,
      label: isPauseActive ? "Finalizar pausa comida" : "Iniciar pausa comida",
      variant: "secondary" as const,
    },
    otros: {
      icon: isPauseActive 
        ? <PlayCircle className="mr-2 h-4 w-4" /> 
        : <PauseCircle className="mr-2 h-4 w-4" />,
      label: isPauseActive ? "Finalizar otra pausa" : "Iniciar otra pausa",
      variant: "outline" as const,
    },
  }

  const config = buttonConfig[type as keyof typeof buttonConfig]

  return (
    <Button
      variant={config.variant}
      onClick={onClick}
      disabled={disabled}
      className={cn("w-full", className)}
    >
      {config.icon}
      {config.label}
    </Button>
  )
}
