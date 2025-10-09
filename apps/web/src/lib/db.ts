import Dexie, { Table } from 'dexie';
import type { TimeEntryDTO, Customer } from '../types';

export interface QueueItem {
  id?: number;
  method: 'POST'|'PUT'|'DELETE';
  url: string;
  body: any;
  createdAt: number;
}

class STMDb extends Dexie {
  customers!: Table<Customer, number>;
  entries!: Table<TimeEntryDTO, number>;
  queue!: Table<QueueItem, number>;

  constructor() {
    super('stm-db');
    this.version(1).stores({
      customers: '++id, name',
      entries: '++id, date, code',
      queue: '++id, createdAt'
    });
  }
}

export const db = new STMDb();
