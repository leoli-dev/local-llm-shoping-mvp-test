import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { Request, Response, NextFunction } from 'express';
import { Database } from 'sqlite';

const router = Router();

router.post('/register', (req: Request, res: Response, next: NextFunction) => {
  const db = (req as any).db;
  register(req, res, db);
});

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  const db = (req as any).db;
  login(req, res, db);
});

export default router;
