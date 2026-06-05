import { Router, Request, Response } from 'express';
import { getDb, saveDatabase } from '../database/init';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

function asyncHandler(fn: (req: any, res: any) => Promise<void>) {
  return (req: any, res: any, next: any) => fn(req, res).catch(next);
}

function queryAll(db: any, sql: string, params: any[] = []): any[][] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: any[][] = [];
  while (stmt.step()) {
    const row = stmt.get();
    if (row) rows.push(row);
  }
  stmt.free();
  return rows;
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
 * GET /api/cart
 */
router.get('/', asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const rows = queryAll(db, `
    SELECT ci.id, ci.quantity, p.id, p.name, p.price, p.image_url
    FROM cart_items ci JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ? ORDER BY ci.created_at DESC
  `, [_req.userId!]);

  const items = rows.map((r: unknown[]) => ({
    cart_id: r[0], quantity: r[1], product_id: r[2],
    product_name: r[3], unit_price: r[4], product_image: r[5],
    subtotal: (r[1] as number) * (r[4] as number),
  }));

  const totalAmount = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  res.json({ items, total_amount: totalAmount, item_count: items.length });
}));

/**
 * POST /api/cart/items
 */
router.post('/items', asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const { product_id, quantity = 1 } = _req.body;
  if (!product_id || quantity < 1) {
    res.status(400).json({ error: 'Invalid input', message: 'product_id required, quantity >= 1' });
    return;
  }

  const db = getDb();
  const userId = _req.userId!;

  const prodRow = queryGet(db, 'SELECT id, name, stock FROM products WHERE id = ?', [product_id]);
  if (!prodRow) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  const currentStock = prodRow[2] as number;
  if (quantity > currentStock) {
    res.status(400).json({ error: 'Insufficient stock', message: `Only ${currentStock} available` });
    return;
  }

  const existing = queryGet(db, 'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, product_id]);

  if (existing) {
    const newQuantity = (existing[1] as number) + quantity;
    if (newQuantity > currentStock) {
      res.status(400).json({ error: 'Insufficient stock', message: `Only ${currentStock} available` });
      return;
    }
    db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQuantity, existing[0]]);
  } else {
    db.run('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [userId, product_id, quantity]);
  }

  saveDatabase();
  res.json({ message: 'Cart updated' });
}));

/**
 * PUT /api/cart/items/:id
 */
router.put('/items/:id', asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const cartId = parseInt(_req.params.id);
  const { quantity } = _req.body;

  if (isNaN(cartId) || quantity === undefined || quantity < 1) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  const db = getDb();
  const item = queryGet(db, 'SELECT id, product_id, quantity FROM cart_items WHERE id = ? AND user_id = ?', [cartId, _req.userId!]);
  if (!item) {
    res.status(404).json({ error: 'Cart item not found' });
    return;
  }

  const prodRow = queryGet(db, 'SELECT stock FROM products WHERE id = ?', [item[1]]);
  if (!prodRow || quantity > (prodRow[0] as number)) {
    res.status(400).json({ error: 'Insufficient stock' });
    return;
  }

  db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, cartId]);
  saveDatabase();
  res.json({ message: 'Cart item updated' });
}));

/**
 * DELETE /api/cart/items/:id
 */
router.delete('/items/:id', asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const cartId = parseInt(_req.params.id);
  const db = getDb();

  db.run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [cartId, _req.userId!]);
  saveDatabase();

  res.json({ message: 'Item removed from cart' });
}));

export default router;
