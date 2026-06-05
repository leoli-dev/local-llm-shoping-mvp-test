import { Router, Request, Response } from 'express';
import { getDb } from '../database/init';

const router = Router();
const ITEMS_PER_PAGE = 6;

function asyncHandler(fn: (req: any, res: any) => Promise<void>) {
  return (req: any, res: any, next: any) => fn(req, res).catch(next);
}

/**
 * GET /api/products
 */
router.get('/', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const db = getDb();
  const page = Math.max(1, parseInt(_req.query.page as string) || 1);
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const search = (_req.query.search as string || '').trim();
  const category = _req.query.category as string || '';

  let whereClause = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (search) {
    whereClause += ' AND p.name LIKE ?';
    params.push(`%${search}%`);
  }
  if (category) {
    whereClause += ' AND p.category_id = ?';
    params.push(category);
  }

  // Count
  const countStmt = db.prepare(`SELECT COUNT(*) FROM products p ${whereClause}`);
  countStmt.bind(params);
  countStmt.step();
  const total = (countStmt.get() || [0])[0] as number;
  countStmt.free();

  // Fetch products
  const allParams = [...params, ITEMS_PER_PAGE, offset];
  const stmt = db.prepare(`
    SELECT p.id, p.name, p.description, p.price, p.stock, p.image_url, c.name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    ${whereClause} ORDER BY p.id DESC LIMIT ? OFFSET ?
  `);
  stmt.bind(allParams);
  const rows: any[][] = [];
  while (stmt.step()) {
    const row = stmt.get();
    if (row) rows.push(row);
  }
  stmt.free();

  res.json({
    products: rows.map((r: unknown[]) => ({
      id: r[0], name: r[1], description: r[2], price: r[3], stock: r[4],
      image_url: r[5], category: r[6] || null,
    })),
    pagination: { page, per_page: ITEMS_PER_PAGE, total, total_pages: Math.ceil(total / ITEMS_PER_PAGE) },
  });
}));

/**
 * GET /api/products/:id
 */
router.get('/:id', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const id = parseInt(_req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid product ID' });
    return;
  }

  const db = getDb();
  const stmt = db.prepare(`
    SELECT p.id, p.name, p.description, p.price, p.stock, p.image_url, c.name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?
  `);
  stmt.bind([id]);
  stmt.step();
  const row = stmt.get();
  stmt.free();

  if (!row) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const [pid, name, description, price, stock, image_url, category] = row as unknown[];
  res.json({ product: { id: pid, name, description, price, stock, image_url, category: category || null } });
}));

/**
 * GET /api/products/categories
 */
router.get('/categories', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const db = getDb();
  const stmt = db.prepare('SELECT id, name, description FROM categories ORDER BY name');
  stmt.bind();
  const rows: any[][] = [];
  while (stmt.step()) {
    const row = stmt.get();
    if (row) rows.push(row);
  }
  stmt.free();

  res.json({ categories: rows.map((r: unknown[]) => ({ id: r[0], name: r[1], description: r[2] })) });
}));

export default router;
