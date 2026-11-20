import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { JWT_SECRET } from '../config';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  college?: string;
  campus?: string;
  is_admin: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT id, email, name, college, campus, is_admin FROM users WHERE id = ? AND is_suspended = 0').get(decoded.id) as any;
    if (!user) {
      return res.status(401).json({ error: 'User not found or suspended' });
    }
    req.user = {
      ...user,
      is_admin: Boolean(user.is_admin),
    };
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = db.prepare('SELECT id, email, name, college, campus, is_admin FROM users WHERE id = ? AND is_suspended = 0').get(decoded.id) as any;
      if (user) {
        req.user = {
          ...user,
          is_admin: Boolean(user.is_admin),
        };
      }
    } catch {
      // silently ignore invalid token for optional auth
    }
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
