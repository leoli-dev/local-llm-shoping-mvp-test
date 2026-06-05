import { Request, Response } from 'express';
import { Database } from 'sqlite';
import { AuthRequest } from '../middleware/auth';

export const createOrder = async (req: AuthRequest, res: Response, db: Database) => {
  const userId = req.userId;
  try {
    await db.run('BEGIN TRANSACTION');

    const cartItems = await db.all(`
      SELECT ci.*, p.name, p.price 
      FROM cart_items ci 
      JOIN products p ON ci.product_id = p.id 
      WHERE ci.user_id = ?`, [userId]);

    if (cartItems.length === 0) {
      await db.run('ROLLBACK');
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of cartItems) {
      const product = await db.get('SELECT stock, price FROM products WHERE id = ?', [item.product_id]);
      if (!product || product.stock < item.quantity) {
        await db.run('ROLLBACK');
        return res.status(409).json({ message: `Insufficient stock for product ID ${item.product_id}` });
      }
      
      totalAmount += product.price * item.quantity;
      orderItemsData.push({
        productId: item.product_id,
        productName: item.name,
        quantity: item.quantity,
        priceAtPurchase: product.price
      });
    }

    const orderResult = await db.run('INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)', [userId, totalAmount, 'pending']);
    const orderId = orderResult.lastID;

    for (const item of orderItemsData) {
      await db.run('INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase) VALUES (?, ?, ?, ?, ?)', 
        [orderId, item.productId, item.productName, item.quantity, item.priceAtPurchase]);
      
      await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.productId]);
    }

    await db.run('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    await db.run('COMMIT');

    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (error) {
    await db.run('ROLLBACK');
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response, db: Database) => {
  const userId = req.userId;
  try {
    const orders = await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOrderDetails = async (req: AuthRequest, res: Response, db: Database) => {
  const userId = req.userId;
  const { id } = req.params;
  try {
    const order = await db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, userId]);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const items = await db.all(`
      SELECT oi.*, p.name as current_name 
      FROM order_items oi 
      LEFT JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ?`, [id]);

    res.json({ ...order, items });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response, db: Database) => {
  const userId = req.userId;
  const { id } = req.params;
  try {
    await db.run('BEGIN TRANSACTION');
    
    const order = await db.get('SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = ?', [id, userId, 'pending']);
    if (!order) {
      await db.run('ROLLBACK');
      return res.status(404).json({ message: 'Order not found or cannot be cancelled' });
    }

    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      await db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await db.run('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', id]);
    await db.run('COMMIT');

    res.json({ message: 'Order cancelled and stock restored' });
  } catch (error) {
    await db.run('ROLLBACK');
    res.status(500).json({ message: 'Internal server error' });
  }
};
