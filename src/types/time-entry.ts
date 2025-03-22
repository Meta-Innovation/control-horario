export type TimeEntryType = 'entrada' | 'pausaCafe' | 'pausaComida' | 'otros' | 'salida';

export interface TimeEntry {
  id: string;
  userId: string;
  type: TimeEntryType;
  timestamp: Date;
  notes?: string | null;
  createdAt: Date;
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