"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/orders — Create order (transaction: validate stock → create order + items → deduct stock → clear cart)
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const order = await db_1.prisma.$transaction(async (tx) => {
            // Get cart with items and products
            const cart = await tx.cart.findUnique({
                where: { userId },
                include: { items: { include: { product: true } } }
            });
            if (!cart || cart.items.length === 0) {
                throw new Error('Cart is empty');
            }
            // Validate stock for all items
            for (const item of cart.items) {
                if (item.product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for "${item.product.name}" (available: ${item.product.stock}, requested: ${item.quantity})`);
                }
            }
            // Calculate total
            const totalPrice = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
            // Create order items (with historical snapshots)
            const orderItems = cart.items.map(item => ({
                productId: item.productId,
                productName: item.product.name,
                productPrice: item.product.price,
                quantity: item.quantity
            }));
            // Create order
            const order = await tx.order.create({
                data: {
                    userId,
                    totalPrice,
                    items: { create: orderItems }
                },
                include: { items: true }
            });
            // Deduct stock
            for (const item of cart.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });
            }
            // Clear cart items
            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
            return order;
        });
        res.status(201).json(order);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message.includes('Insufficient stock')) {
            res.status(409).json({ error: message });
            return;
        }
        if (message.includes('Cart is empty')) {
            res.status(400).json({ error: message });
            return;
        }
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/orders — List user's orders
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await db_1.prisma.order.findMany({
            where: { userId },
            include: { items: { select: { id: true, productName: true, productPrice: true, quantity: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    }
    catch (error) {
        console.error('List orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/orders/:id — Get order detail
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = parseInt(req.params.id);
        const order = await db_1.prisma.order.findFirst({
            where: { id: orderId, userId },
            include: { items: { include: { product: true } } }
        });
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        res.json(order);
    }
    catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/orders/:id/cancel — Cancel pending order (rollback stock)
router.post('/:id/cancel', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = parseInt(req.params.id);
        const order = await db_1.prisma.$transaction(async (tx) => {
            const existingOrder = await tx.order.findFirst({
                where: { id: orderId, userId },
                include: { items: true }
            });
            if (!existingOrder) {
                throw new Error('Order not found');
            }
            if (existingOrder.status !== 'pending') {
                throw new Error(`Cannot cancel order with status "${existingOrder.status}"`);
            }
            // Rollback stock
            for (const item of existingOrder.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } }
                });
            }
            // Update order status
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: 'cancelled' },
                include: { items: { include: { product: true } } }
            });
            return updatedOrder;
        });
        res.json(order);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message.includes('Order not found')) {
            res.status(404).json({ error: message });
            return;
        }
        if (message.includes('Cannot cancel')) {
            res.status(400).json({ error: message });
            return;
        }
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map