export type Code = 'ADI' | 'AKN' | 'X';

export interface TimeEntryDTO {
  id?: number;
  date: string;     // YYYY-MM-DD
  code: Code;
  start: string;    // HH:MM
  end: string;      // HH:MM
  customerId?: number | null;
  description?: string | null;
  order_number?: string | null;
  todo?: boolean;
}

export interface Customer {
  id: number;
  name: string;
  number?: string | null;
}