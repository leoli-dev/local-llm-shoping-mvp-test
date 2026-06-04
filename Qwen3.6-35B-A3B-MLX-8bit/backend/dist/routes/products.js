"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const router = (0, express_1.Router)();
// GET /api/products/categories
router.get('/categories', async (_req, res) => {
    try {
        const categories = await db_1.prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
        res.json({ categories });
    }
    catch (error) {
        console.error('List categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/products?page=1&limit=6&search=keyword&category=electronics
router.get('/', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 6));
        const search = req.query.search || '';
        const category = req.query.category || '';
        const where = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        if (category) {
            where.category = { name: { equals: category, mode: 'insensitive' } };
        }
        const [total, products] = await Promise.all([
            db_1.prisma.product.count({ where }),
            db_1.prisma.product.findMany({
                where,
                include: { category: { select: { id: true, name: true } } },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' }
            })
        ]);
        res.json({
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('List products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await db_1.prisma.product.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { category: { select: { id: true, name: true } } }
        });
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json(product);
    }
    catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map