import React, { useEffect, useState } from 'react';
import { getCustomers, createEntry, getEntries, login, fetchMe } from './lib/api';
import type { Customer, TimeEntryDTO, Code } from './types';
import { flushQueue } from './lib/sync';

function todayISO() {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}

const codes: Code[] = ['ADI','AKN','X'];

export default function App() {
  const [me, setMe] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [date, setDate] = useState(todayISO());
  const [code, setCode] = useState<Code>('ADI');
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('09:00');
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [todo, setTodo] = useState(false);
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin');

  useEffect(() => {
    (async () => {
      setMe(await fetchMe());
    })();
    window.addEventListener('online', () => flushQueue());
  }, []);

  useEffect(() => {
    if (me) {
      getCustomers().then(setCustomers);
      getEntries(date, date).then(setEntries);
    }
  }, [me, date]);

  useEffect(() => {
    if (code === 'ADI') {
      setCustomerId(null);
    } else if (code === 'AKN') {
    } else if (code === 'X') {
      setCustomerId(null);
      setDescription('Pause');
      setOrderNumber('');
      setTodo(false);
    }
  }, [code]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await login(email, password);
    setMe(await fetchMe());
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: TimeEntryDTO = {
      date, code, start, end,
      customerId: code === 'AKN' ? Number(customerId) || undefined : undefined,
      description: code === 'X' ? 'Pause' : (description || undefined),
      order_number: orderNumber || undefined,
      todo
    };
    await createEntry(payload);
    setEntries(await getEntries(date, date));
  }

  if (!me) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Anmeldung</h2>
        <form onSubmit={handleLogin}>
          <input placeholder="E-Mail" value={email} onChange={e=>setEmail(e.target.value)} />
          <input placeholder="Passwort" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button type="submit">Login</button>
        </form>
        <p>Tipp: admin@example.com / admin (Seed)</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, display: 'grid', gap: 16 }}>
      <h2>STM – Erfassung</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <label>Datum
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </label>
        <label>Code
          <select value={code} onChange={e=>setCode(e.target.value as Code)}>
            {codes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Von
          <input type="time" value={start} onChange={e=>setStart(e.target.value)} />
        </label>
        <label>Bis
          <input type="time" value={end} onChange={e=>setEnd(e.target.value)} />
        </label>
        {code === 'AKN' && (
          <label>Kunde
            <select value={customerId ?? ''} onChange={e=>setCustomerId(Number(e.target.value))}>
              <option value="" disabled>Bitte wählen</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}
        <label>Beschreibung
          <input value={description} onChange={e=>setDescription(e.target.value)} placeholder={code === 'X' ? 'Pause' : ''}/>
        </label>
        <label>Auftrags-Nr.
          <input value={orderNumber} onChange={e=>setOrderNumber(e.target.value)} />
        </label>
        <label>
          <input type="checkbox" checked={todo} onChange={e=>setTodo(e.target.checked)} /> TODO
        </label>
        <button type="submit">Speichern</button>
      </form>

      <section>
        <h3>Tageseinträge {date}</h3>
        <ul>
          {entries.map((e: any) => (
            <li key={e.id || `${e.start}-${e.end}`}>[{e.code}] {e.start}-{e.end} {e.area_or_customer || ''} {e.description || ''}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}