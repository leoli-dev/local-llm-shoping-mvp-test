import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDatabase } from '../database/init';
import { generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

function asyncHandler(fn: (req: any, res: any) => Promise<void>) {
  return (req: any, res: any, next: any) => fn(req, res).catch(next);
}

function queryGet(db: any, sql: string, params: any[] = []): any[] | undefined {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (!stmt.step()) { stmt.free(); return undefined; }
  const row = stmt.get();
  stmt.free();
  return row;
}

/**
 * POST /api/auth/register
 */
router.post('/register', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: 'Missing required fields', message: 'username, email, and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password too short', message: 'Password must be at least 6 characters' });
    return;
  }
  if (!email.includes('@') || !email.includes('.')) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 12);
  const db = getDb();

  try {
    db.run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, passwordHash]);

    // Get rowid BEFORE saving (save resets in-memory state)
    const result = queryGet(db, 'SELECT last_insert_rowid()');
    const userId = result![0] as number;

    saveDatabase();
    const token = generateToken(userId);

    res.status(201).json({
      message: 'Registration successful',
      user: { id: userId, username, email },
      token,
    });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Conflict', message: 'Username or email already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}));

/**
 * POST /api/auth/login
 */
router.post('/login', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Missing credentials', message: 'email and password are required' });
    return;
  }

  const db = getDb();
  const row = queryGet(db, 'SELECT id, username, email, password_hash FROM users WHERE email = ?', [email]);

  if (!row) {
    res.status(401).json({ error: 'Invalid credentials', message: 'Email or password is incorrect' });
    return;
  }

  const [id, username, userEmail, passwordHash] = row as unknown[];
  if (!bcrypt.compareSync(password, passwordHash as string)) {
    res.status(401).json({ error: 'Invalid credentials', message: 'Email or password is incorrect' });
    return;
  }

  const token = generateToken(id as number);
  res.json({
    message: 'Login successful',
    user: { id: id as number, username: username as string, email: userEmail as string },
    token,
  });
}));

/**
 * GET /api/auth/me
 */
router.get('/me', asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const row = queryGet(db, 'SELECT id, username, email, created_at FROM users WHERE id = ?', [_req.userId!]);

  if (!row) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const [id, username, email, created_at] = row as unknown[];
  res.json({
    user: { id: id as number, username: username as string, email: email as string, created_at: created_at as string },
  });
}));

export default router;
