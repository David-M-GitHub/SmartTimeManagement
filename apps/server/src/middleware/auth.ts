import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';

const TOKEN_COOKIE = 'access_token';

export interface AuthRequest extends Request {
  user?: { id: number; role: 'admin' | 'user'; name: string; email: string };
}

export function signToken(payload: object) {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign(payload, secret, { expiresIn: '8h' });
}

export async function authOptional(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.[TOKEN_COOKIE];
  if (!token) return next();
  try {
    const secret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, secret) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (user) req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
  } catch {}
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  next();
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(TOKEN_COOKIE);
}