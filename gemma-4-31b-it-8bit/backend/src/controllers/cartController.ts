import { Request, Response } from 'express';
import { Database } from 'sqlite';
import { AuthRequest } from '../middleware/auth';

export const getCart = async (req: AuthRequest, res: Response, db: Database) => {
  const userId = req.userId;
  try {
    const items = await db.all(`
      SELECT ci.*, p.name, p.price, p.image_url 
      FROM cart_items ci 
      JOIN products p ON ci.product_id = p.id 
      WHERE ci.user_id = ?`, [userId]);
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.json({ items, total });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addToCart = async (req: AuthRequest, res: Response, db: Database) => {
  const userId = req.userId;
  const { productId, quantity = 1 } = req.body;
  try {
    const product = await db.get('SELECT stock FROM products WHERE id = ?', [productId]);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < quantity) return res.status(409).json({ message: 'Not enough stock' });

    await db.run(`
      INSERT INTO cart_items (user_id, product_id, quantity) 
      VALUES (?, ?, ?) 
      ON CONFLICT(user_id, product_id) 
      DO UPDATE SET quantity = quantity + excluded.quantity`, [userId, productId, quantity]);
    
    res.json({ message: 'Added to cart' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCart = async (req: AuthRequest, res: Response, db: Database) => {
  const userId = req.userId;
  const { productId, quantity } = req.body;
  try {
    if (quantity <= 0) {
      await db.run('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]);
    } else {
      const product = await db.get('SELECT stock FROM products WHERE id = ?', [productId]);
      if (!product || product.stock < quantity) return res.status(409).json({ message: 'Not enough stock' });
      await db.run('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?', [quantity, userId, productId]);
    }
    res.json({ message: 'Cart updated' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
