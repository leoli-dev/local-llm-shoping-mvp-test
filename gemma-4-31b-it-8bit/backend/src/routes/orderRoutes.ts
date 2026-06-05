import { Router } from 'express';
import { createOrder, getMyOrders, getOrderDetails, cancelOrder } from '../controllers/orderController';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';
import { Database } from 'sqlite';

const router = Router();

router.use(authMiddleware);

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  const db = (req as any).db;
  createOrder(req as AuthRequest, res, db);
});

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const db = (req as any).db;
  getMyOrders(req as AuthRequest, res, db);
});

router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const db = (req as any).db;
  getOrderDetails(req as AuthRequest, res, db);
});

router.post('/cancel/:id', (req: Request, res: Response, next: NextFunction) => {
  const db = (req as any).db;
  cancelOrder(req as AuthRequest, res, db);
});

export default router;
