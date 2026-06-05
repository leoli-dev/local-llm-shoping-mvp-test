import { Router } from 'express';
import { getCart, addToCart, updateCart } from '../controllers/cartController';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';
import { Database } from 'sqlite';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const db = (req as any).db;
  getCart(req as AuthRequest, res, db);
});

router.post('/add', (req: Request, res: Response, next: NextFunction) => {
  const db = (req as any).db;
  addToCart(req as AuthRequest, res, db);
});

router.put('/update', (req: Request, res: Response, next: NextFunction) => {
  const db = (req as any).db;
  updateCart(req as AuthRequest, res, db);
});

export default router;
