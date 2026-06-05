import { Request, Response } from 'express';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { Database } from 'sqlite';

export const register = async (req: Request, res: Response, db: Database) => {
  const { username, email, password } = req.body;
  try {
    const hashed = await hashPassword(password);
    const result = await db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashed]);
    const token = generateToken(result.lastID);
    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      username 
    });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response, db: Database) => {
  const { email, password } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user.id);
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
