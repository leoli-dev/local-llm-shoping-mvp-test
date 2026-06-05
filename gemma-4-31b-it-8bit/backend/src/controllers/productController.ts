import { Request, Response } from 'express';
import { Database } from 'sqlite';

export const getProducts = async (req: Request, res: Response, db: Database) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 6;
  const offset = (page - 1) * limit;
  const search = req.query.search as string;
  const category = req.query.category as string;

  try {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const products = await db.all(query, params);
    
    let countQuery = 'SELECT COUNT(*) as count FROM products WHERE 1=1';
    const countParams = [...params.slice(0, -2)];
    if (search) countQuery += ' AND name LIKE ?';
    if (category) countQuery += ' AND category = ?';
    
    const total = await db.get(countQuery, countParams);
    res.json({
      products,
      totalPages: Math.ceil((total as any).count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProductById = async (req: Request, res: Response, db: Database) => {
  const { id } = req.params;
  try {
    const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
