import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatElapsedTime(
  startTime: Date,
  endTime: Date = new Date()
): string {
  const diffInSeconds = Math.floor(
    (endTime.getTime() - startTime.getTime()) / 1000
  );

  const hours = Math.floor(diffInSeconds / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  const seconds = diffInSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

// Función auxiliar para asegurar que timestamp es un objeto Date
export function ensureDate(timestamp: Date | string): Date {
  return timestamp instanceof Date
    ? timestamp
    : new Date(timestamp);
}
