import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { isValidHHMM, compareHHMM, overlaps } from '../utils/time.js';
import { Code } from '@prisma/client';

export const entriesRouter = Router();

entriesRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  const where: any = { userId: req.user!.id };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  const data = await prisma.timeEntry.findMany({
    where,
    orderBy: [{ date: 'asc' }, { start: 'asc' }],
    include: { customer: true }
  });
  res.json(data);
});

entriesRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  const {
    date, code, start, end,
    customerId, description, order_number, todo
  } = req.body as {
    date: string; code: 'ADI' | 'AKN' | 'X'; start: string; end: string;
    customerId?: number; description?: string; order_number?: string; todo?: boolean;
  };

  if (!date || !code || !start || !end) return res.status(400).json({ error: 'missing fields' });
  if (!isValidHHMM(start) || !isValidHHMM(end)) return res.status(400).json({ error: 'time format must be HH:MM' });
  if (compareHHMM(start, end) >= 0) return res.status(400).json({ error: 'start must be before end' });

  let area_or_customer: string | null = null;
  let customerIdFinal: number | null = null;
  const codeEnum = code as Code;

  if (codeEnum === 'ADI') {
    area_or_customer = 'DIT';
    customerIdFinal = null;
  } else if (codeEnum === 'AKN') {
    if (!customerId) return res.status(400).json({ error: 'customer required for AKN' });
    const customer = await prisma.customer.findUnique({ where: { id: Number(customerId) } });
    if (!customer) return res.status(400).json({ error: 'invalid customer' });
    area_or_customer = customer.name;
    customerIdFinal = customer.id;
  } else if (codeEnum === 'X') {
    area_or_customer = null;
  } else {
    return res.status(400).json({ error: 'invalid code' });
  }

  const day = new Date(date);
  day.setHours(0,0,0,0);

  const sameDay = await prisma.timeEntry.findMany({
    where: { userId: req.user!.id, date: day }
  });
  const hasOverlap = sameDay.some(e => overlaps(start, end, e.start, e.end));
  if (hasOverlap) {
    return res.status(409).json({ error: 'overlap detected for this user and day' });
  }

  const created = await prisma.timeEntry.create({
    data: {
      userId: req.user!.id,
      date: day,
      code: codeEnum,
      start, end,
      area_or_customer,
      description: codeEnum === 'X' ? 'Pause' : (description ?? null),
      order_number: order_number ?? null,
      todo: Boolean(todo),
      customerId: customerIdFinal
    }
  });

  res.status(201).json(created);
});

entriesRouter.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.timeEntry.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user!.id) return res.status(404).json({ error: 'not found' });

  const { start, end, code, customerId, description, order_number, todo } = req.body as any;

  if (start && !isValidHHMM(start)) return res.status(400).json({ error: 'invalid start' });
  if (end && !isValidHHMM(end)) return res.status(400).json({ error: 'invalid end' });
  if ((start && end) && compareHHMM(start, end) >= 0) return res.status(400).json({ error: 'start must be before end' });

  let data: any = { start, end, description, order_number, todo };
  if (code) {
    if (!['ADI','AKN','X'].includes(code)) return res.status(400).json({ error: 'invalid code' });
    if (code === 'ADI') {
      data.code = 'ADI';
      data.area_or_customer = 'DIT';
      data.customerId = null;
      if (!description) data.description = existing.description;
    } else if (code === 'AKN') {
      if (!customerId) return res.status(400).json({ error: 'customer required' });
      const c = await prisma.customer.findUnique({ where: { id: Number(customerId) } });
      if (!c) return res.status(400).json({ error: 'invalid customer' });
      data.code = 'AKN';
      data.customerId = c.id;
      data.area_or_customer = c.name;
    } else if (code === 'X') {
      data.code = 'X';
      data.customerId = null;
      data.area_or_customer = null;
      data.description = 'Pause';
    }
  } else if (customerId) {
    if (existing.code !== 'AKN') return res.status(400).json({ error: 'customer allowed only for AKN' });
    const c = await prisma.customer.findUnique({ where: { id: Number(customerId) } });
    if (!c) return res.status(400).json({ error: 'invalid customer' });
    data.customerId = c.id;
    data.area_or_customer = c.name;
  }

  const newStart = data.start ?? existing.start;
  const newEnd = data.end ?? existing.end;
  const sameDay = await prisma.timeEntry.findMany({
    where: { userId: req.user!.id, date: existing.date, NOT: { id: existing.id } }
  });
  const hasOverlap = sameDay.some(e => overlaps(newStart, newEnd, e.start, e.end));
  if (hasOverlap) return res.status(409).json({ error: 'overlap detected for this user and day' });

  const updated = await prisma.timeEntry.update({ where: { id }, data });
  res.json(updated);
});

entriesRouter.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.timeEntry.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user!.id) return res.status(404).json({ error: 'not found' });
  await prisma.timeEntry.delete({ where: { id } });
  res.status(204).end();
});