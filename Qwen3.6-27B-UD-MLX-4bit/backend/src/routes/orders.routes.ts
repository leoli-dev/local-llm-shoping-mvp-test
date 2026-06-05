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
 * POST /api/orders
 */
router.post('/', asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();

  const cartRows = queryAll(db, `
    SELECT ci.id, ci.quantity, p.id, p.name, p.price, p.stock
    FROM cart_items ci JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
  `, [_req.userId!]);

  if (cartRows.length === 0) {
    res.status(400).json({ error: 'Cart is empty', message: 'Add items before placing an order' });
    return;
  }

  for (const row of cartRows) {
    const quantity = row[1] as number;
    const stock = row[5] as number;
    if (quantity > stock) {
      res.status(409).json({
        error: 'Insufficient stock',
        message: `Not enough stock for "${row[3]}". Available: ${stock}, Requested: ${quantity}`,
      });
      return;
    }
  }

  const totalAmount = cartRows.reduce(
    (sum, row) => sum + (row[1] as number) * (row[4] as number), 0
  );

  db.run('BEGIN TRANSACTION');

  try {
    db.run('INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [_req.userId!, totalAmount, 'pending']);

    const orderIdRow = queryGet(db, 'SELECT last_insert_rowid()');
    const orderId = orderIdRow![0] as number;

    for (const row of cartRows) {
      const productId = row[2] as number;
      const name = row[3] as string;
      const price = row[4] as number;
      const quantity = row[1] as number;
      const subtotal = price * quantity;

      db.run(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, productId, name, quantity, price, subtotal]
      );

      db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, productId]);
    }

    db.run('DELETE FROM cart_items WHERE user_id = ?', [_req.userId!]);
    db.run('COMMIT');
    saveDatabase();

    res.status(201).json({
      message: 'Order created successfully',
      order: { id: orderId, total_amount: totalAmount, status: 'pending' },
    });
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}));

/**
 * GET /api/orders
 */
router.get('/', asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const page = Math.max(1, parseInt(_req.query.page as string) || 1);
  const perPage = 10;
  const offset = (page - 1) * perPage;

  const countRow = queryGet(db, 'SELECT COUNT(*) FROM orders WHERE user_id = ?', [_req.userId!]);
  const total = (countRow || [0])[0] as number;

  const rows = queryAll(db,
    'SELECT id, total_amount, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [_req.userId!, perPage, offset]
  );

  res.json({
    orders: rows.map((r: unknown[]) => ({
      id: r[0], total_amount: r[1], status: r[2], created_at: r[3],
    })),
    pagination: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) },
  });
}));

/**
 * GET /api/orders/:id
 */
router.get('/:id', asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const orderId = parseInt(_req.params.id);
  if (isNaN(orderId)) {
    res.status(400).json({ error: 'Invalid order ID' });
    return;
  }

  const db = getDb();
  const orderRow = queryGet(db, 'SELECT id, total_amount, status, created_at FROM orders WHERE id = ? AND user_id = ?', [orderId, _req.userId!]);

  if (!orderRow) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const itemRows = queryAll(db, 'SELECT id, product_id, product_name, quantity, unit_price, subtotal FROM order_items WHERE order_id = ?', [orderId]);

  res.json({
    order: {
      id: orderRow[0], total_amount: orderRow[1], status: orderRow[2], created_at: orderRow[3],
      items: itemRows.map((r: unknown[]) => ({
        id: r[0], product_id: r[1], product_name: r[2],
        quantity: r[3], unit_price: r[4], subtotal: r[5],
      })),
    },
  });
}));

/**
 * POST /api/orders/:id/cancel
 */
router.post('/:id/cancel', asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const orderId = parseInt(_req.params.id);
  const db = getDb();

  const orderRow = queryGet(db, 'SELECT id, status FROM orders WHERE id = ? AND user_id = ?', [orderId, _req.userId!]);

  if (!orderRow) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (orderRow[1] !== 'pending') {
    res.status(400).json({ error: 'Cannot cancel', message: 'Only pending orders can be cancelled' });
    return;
  }

  db.run('BEGIN TRANSACTION');
  try {
    const itemRows = queryAll(db, 'SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);

    for (const row of itemRows) {
      db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [row[1], row[0]]);
    }

    db.run("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orderId]);
    db.run('COMMIT');
    saveDatabase();

    res.json({ message: 'Order cancelled. Stock restored.' });
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}));

export default router;
