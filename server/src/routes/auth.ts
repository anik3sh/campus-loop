import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', (req: Request, res: Response) => {
  const { name, email, password, college, campus } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name is required (at least 2 characters)' });
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, college, campus)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    name.trim(),
    normalizedEmail,
    hash,
    college && college.trim() ? college.trim() : 'Campus University',
    campus && campus.trim() ? campus.trim() : 'Main Campus'
  );

  const rawUser = db.prepare(`
    SELECT id, name, email, college, campus, bio, avatar, is_admin, response_rate, total_sold, created_at 
    FROM users WHERE id = ?
  `).get(id) as any;

  const secret = process.env.JWT_SECRET || 'fallback_secret_campus_loop';
  const token = jwt.sign({ id }, secret, { expiresIn: '30d' });

  const user = {
    ...rawUser,
    is_admin: Boolean(rawUser.is_admin),
  };

  res.status(201).json({ user, token });
});

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(normalizedEmail) as any;
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.is_suspended) {
    return res.status(403).json({ error: 'Account suspended. Contact platform support.' });
  }
  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const secret = process.env.JWT_SECRET || 'fallback_secret_campus_loop';
  const token = jwt.sign({ id: user.id }, secret, { expiresIn: '30d' });

  const { password_hash, ...safeUser } = user;
  safeUser.is_admin = Boolean(safeUser.is_admin);

  res.json({ user: safeUser, token });
});

router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_campus_loop';
    const decoded = jwt.verify(token, secret) as any;
    const user = db.prepare(`
      SELECT id, name, email, college, campus, bio, avatar, is_admin, response_rate, total_sold, created_at 
      FROM users WHERE id = ? AND is_suspended = 0
    `).get(decoded.id) as any;

    if (!user) return res.status(401).json({ error: 'User not found or suspended' });
    user.is_admin = Boolean(user.is_admin);

    res.json({ user });
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

export default router;
