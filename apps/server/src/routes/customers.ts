import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

export const customersRouter = Router();

customersRouter.get('/', requireAuth, async (_req, res) => {
  const data = await prisma.customer.findMany({ orderBy: { name: 'asc' } });
  res.json(data);
});

customersRouter.post('/', requireAdmin, async (req, res) => {
  const { name, number } = req.body as { name: string; number?: string };
  if (!name) return res.status(400).json({ error: 'name required' });
  const c = await prisma.customer.create({ data: { name, number } });
  res.status(201).json(c);
});

customersRouter.put('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { name, number } = req.body as { name?: string; number?: string | null };
  const c = await prisma.customer.update({ where: { id }, data: { name, number } });
  res.json(c);
});

customersRouter.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.customer.delete({ where: { id } });
  res.status(204).end();
});