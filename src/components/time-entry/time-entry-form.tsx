import { useState } from "react";
import { TimeEntryButton } from "@/components/time-entry/time-entry-button";
import {
  PauseType,
  TimeEntryType,
} from "@/types/time-entry";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "../ui/toast";

interface TimeEntryFormProps {
  onSubmit: (
    type: TimeEntryType,
    notes?: string
  ) => Promise<void>;
  isLoading: boolean;
  hasActiveWorkday: boolean;
  activePauses: {
    pausaCafe: boolean;
    pausaComida: boolean;
    otros: boolean;
  };
}

export function TimeEntryForm({
  onSubmit,
  isLoading,
  hasActiveWorkday,
  activePauses = {
    pausaCafe: false,
    pausaComida: false,
    otros: false,
  },
}: TimeEntryFormProps) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (
    type: TimeEntryType | PauseType
  ) => {
    try {
      // Convertimos el tipo de pausa al tipo específico (inicio o fin)
      let entryType: TimeEntryType = type as TimeEntryType;

      // Si es un tipo de pausa, determinar si es inicio o fin
      if (type === "pausaCafe") {
        entryType = activePauses.pausaCafe
          ? "finPausaCafe"
          : "inicioPausaCafe";
      } else if (type === "pausaComida") {
        entryType = activePauses.pausaComida
          ? "finPausaComida"
          : "inicioPausaComida";
      } else if (type === "otros") {
        entryType = activePauses.otros
          ? "finOtros"
          : "inicioOtros";
      }

      await onSubmit(entryType, notes.trim() || undefined);

      // Mostrar toast de éxito
      toast({
        description: `Registrado guardado correctamente`,
        variant: "default",
      });

      setNotes("");
      setShowNotes(false);
    } catch (error) {
      // Mostrar toast de error
      toast({
        title: "Error en el registro",
        description:
          "No se pudo completar el registro. Intenta nuevamente.",
        variant: "destructive",
      });

      console.error("Error submitting time entry:", error);
    }
  };

  // Verificamos si cualquier pausa está activa para deshabilitar las otras
  const anyPauseActive =
    activePauses.pausaCafe ||
    activePauses.pausaComida ||
    activePauses.otros;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TimeEntryButton
          type="entrada"
          onClick={() => handleSubmit("entrada")}
          disabled={isLoading || hasActiveWorkday}
        />
        <TimeEntryButton
          type="salida"
          onClick={() => handleSubmit("salida")}
          disabled={
            isLoading || !hasActiveWorkday || anyPauseActive
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <TimeEntryButton
          type="pausaCafe"
          onClick={() => handleSubmit("pausaCafe")}
          disabled={
            isLoading ||
            !hasActiveWorkday ||
            (anyPauseActive && !activePauses.pausaCafe)
          }
          isPauseActive={activePauses.pausaCafe}
        />
        <TimeEntryButton
          type="pausaComida"
          onClick={() => handleSubmit("pausaComida")}
          disabled={
            isLoading ||
            !hasActiveWorkday ||
            (anyPauseActive && !activePauses.pausaComida)
          }
          isPauseActive={activePauses.pausaComida}
        />
        <TimeEntryButton
          type="otros"
          onClick={() => handleSubmit("otros")}
          disabled={
            isLoading ||
            !hasActiveWorkday ||
            (anyPauseActive && !activePauses.otros)
          }
          isPauseActive={activePauses.otros}
        />
      </div>

      <div className="flex items-center justify-center mt-4">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className="text-sm"
        >
          {showNotes ? "Ocultar notas" : "Añadir nota"}
        </Button>
      </div>

      {showNotes && (
        <div className="mt-2 space-y-2">
          <Label htmlFor="notes">Notas adicionales:</Label>
          <Textarea
            id="notes"
            placeholder="Añade detalles sobre esta entrada..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className={cn(
              "resize-none",
              isLoading && "opacity-50"
            )}
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  );
}
