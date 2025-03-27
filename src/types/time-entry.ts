export type TimeEntryType = 
  "entrada" 
  | "salida" 
  | "inicioPausaCafe" 
  | "finPausaCafe" 
  | "inicioPausaComida" 
  | "finPausaComida" 
  | "inicioOtros" 
  | "finOtros";

export type PauseType = "pausaCafe" | "pausaComida" | "otros";

export interface TimeEntry {
  id: string;
  userId: string;
  type: TimeEntryType;
  timestamp: string;
  notes?: string;
  workdayId?: string;
}

export interface DailyTimeRecord {
  date: Date;
  entries: TimeEntry[];
  totalWorkedTime: number; // en segundos
  breakTime: number; // en segundos
  startTime?: Date | null;
  endTime?: Date | null;
}

export interface DailySummary {
  id: string;
  userId: string;
  date: Date;
  totalTime: number; // en segundos
  startTime: Date | null;
  endTime: Date | null;
  breaksCount: number;
  breaksTime: number; // en segundos
  createdAt: Date;
  updatedAt: Date;
}