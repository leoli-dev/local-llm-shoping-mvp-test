import { Router } from 'express';
import { getProducts, getProductById } from '../controllers/productController';
import { Request, Response, NextFunction } from 'express';
import { Database } from 'sqlite';

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const db = (req as any).db;
  getProducts(req, res, db);
});

router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const db = (req as any).db;
  getProductById(req, res, db);
});

export default router;
