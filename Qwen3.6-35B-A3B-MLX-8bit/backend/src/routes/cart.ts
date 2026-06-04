import { Router } from 'express';
import { prisma } from '../lib/db';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

// Helper: get or create cart for user
async function getOrCreateCart(userId: number) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: { items: { include: { product: true } } }
    });
  }

  return cart;
}

// GET /api/cart
router.get('/', authenticate, async (req, res) => {
  try {
    const cart = await getOrCreateCart((req as AuthRequest).user!.id);

    const items = cart.items.map(item => ({
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
      image: item.product.imageUrl || ''
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    res.json({ items, total });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cart/items
router.post('/items', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      res.status(400).json({ error: 'Valid productId and quantity (>= 1) are required' });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const cart = await getOrCreateCart(userId);

    // Upsert: merge quantity if item exists
    const cartItem = await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, productId, quantity }
    });

    // Refresh cart with items
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } }
    });

    const items = updatedCart!.items.map(item => ({
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
      image: item.product.imageUrl || ''
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    res.status(201).json({ items, total });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/cart/items/:productId
router.put('/items/:productId', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const productId = parseInt(req.params.productId);
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      res.status(400).json({ error: 'Valid quantity (>= 0) is required' });
      return;
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    if (quantity === 0) {
      // Delete the item
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId }
      });
    } else {
      await prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId } },
        data: { quantity }
      });
    }

    // Refresh cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } }
    });

    const items = updatedCart!.items.map(item => ({
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
      image: item.product.imageUrl || ''
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    res.json({ items, total });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cart/items/:productId
router.delete('/items/:productId', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const productId = parseInt(req.params.productId);

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId }
    });

    // Refresh cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } }
    });

    const items = updatedCart!.items.map(item => ({
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
      image: item.product.imageUrl || ''
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    res.json({ items, total });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
