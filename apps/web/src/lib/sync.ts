import { db } from './db';

export async function flushQueue() {
  if (!navigator.onLine) return;
  const items = await db.queue.toArray();
  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item.body)
      });
      if (res.ok) await db.queue.delete(item.id!);
    } catch {
      // keep in queue
    }
  }
}