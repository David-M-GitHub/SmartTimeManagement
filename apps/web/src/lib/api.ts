import { db } from './db';
import type { Customer, TimeEntryDTO } from '../types';

const headers: HeadersInit = { 'Content-Type': 'application/json' };
const opts: RequestInit = { headers, credentials: 'include' };

function online() {
  return navigator.onLine;
}

export async function fetchMe() {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  return res.ok ? res.json() : null;
}

export async function login(email: string, password: string) {
  const res = await fetch('/api/auth/login', { ...opts, method: 'POST', body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error('Login fehlgeschlagen');
  return res.json();
}

export async function logout() {
  await fetch('/api/auth/logout', { ...opts, method: 'POST' });
}

export async function getCustomers(): Promise<Customer[]> {
  if (!online()) return db.customers.toArray();
  const res = await fetch('/api/customers', { ...opts });
  const data = await res.json();
  await db.customers.clear();
  await db.customers.bulkAdd(data);
  return data;
}

export async function getEntries(from?: string, to?: string) {
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const res = await fetch(`/api/entries?${qs.toString()}`, { ...opts });
  return res.json();
}

export async function createEntry(payload: TimeEntryDTO) {
  if (online()) {
    const res = await fetch('/api/entries', { ...opts, method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } else {
    await db.entries.add(payload);
    await db.queue.add({ method: 'POST', url: '/api/entries', body: payload, createdAt: Date.now() });
    return payload;
  }
}
