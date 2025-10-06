import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { toCsv, toXlsx } from '../services/exporter.js';

export const exportRouter = Router();

exportRouter.get('/xlsx', requireAuth, async (req: AuthRequest, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  if (!from || !to) return res.status(400).json({ error: 'from and to required (YYYY-MM-DD)' });
  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: req.user!.id,
      date: { gte: new Date(from), lte: new Date(to) }
    },
    include: { customer: true },
    orderBy: [{ date: 'asc' }, { start: 'asc' }]
  });
  const buffer = await toXlsx(entries);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="export_${from}_${to}.xlsx"`);
  res.send(buffer);
});

exportRouter.get('/csv', requireAuth, async (req: AuthRequest, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  if (!from || !to) return res.status(400).json({ error: 'from and to required (YYYY-MM-DD)' });
  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: req.user!.id,
      date: { gte: new Date(from), lte: new Date(to) }
    },
    include: { customer: true },
    orderBy: [{ date: 'asc' }, { start: 'asc' }]
  });
  const csv = toCsv(entries);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="export_${from}_${to}.csv"`);
  res.send(csv);
});