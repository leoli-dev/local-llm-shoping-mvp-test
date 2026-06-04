"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../lib/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const SALT_ROUNDS = 10;
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({ error: 'Username, email, and password are required' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }
        const existingUser = await db_1.prisma.user.findFirst({
            where: { OR: [{ username }, { email }] }
        });
        if (existingUser) {
            res.status(409).json({ error: 'Username or email already exists' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, SALT_ROUNDS);
        const user = await db_1.prisma.user.create({
            data: { username, email, passwordHash },
            select: { id: true, username: true, email: true, createdAt: true }
        });
        // Create empty cart for user
        await db_1.prisma.cart.create({ data: { userId: user.id } });
        const accessToken = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, auth_1.JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, auth_1.JWT_REFRESH_SECRET, { expiresIn: '30d' });
        res.status(201).json({ user, accessToken, refreshToken });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const user = await db_1.prisma.user.findUnique({
            where: { email },
            select: { id: true, username: true, email: true, passwordHash: true, createdAt: true }
        });
        if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const accessToken = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, auth_1.JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, auth_1.JWT_REFRESH_SECRET, { expiresIn: '30d' });
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, accessToken, refreshToken });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token is required' });
            return;
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(refreshToken, auth_1.JWT_REFRESH_SECRET);
        }
        catch {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, username: true }
        });
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        const accessToken = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, auth_1.JWT_SECRET, { expiresIn: '7d' });
        res.json({ accessToken });
    }
    catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/auth/logout
router.post('/logout', async (_req, res) => {
    // Stateless JWT — client clears tokens
    res.json({ message: 'Logged out successfully' });
});
exports.default = router;
//# sourceMappingURL=auth.js.map