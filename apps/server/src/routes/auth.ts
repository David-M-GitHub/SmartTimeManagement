import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import bcrypt from 'bcryptjs';
import { AuthRequest, clearAuthCookie, setAuthCookie, signToken } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.passworthash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = signToken({ id: user.id, role: user.role });
  setAuthCookie(res, token);
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get('/me', async (req: AuthRequest, res) => {
  if (!req.user) return res.status(200).json(null);
  res.json(req.user);
});