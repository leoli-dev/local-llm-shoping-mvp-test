"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const SALT_ROUNDS = 10;
async function main() {
    console.log('Seeding database...');
    // Clear existing data (order matters due to foreign keys)
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    // Create categories
    const categories = await Promise.all([
        prisma.category.create({ data: { name: 'Electronics', description: 'Gadgets and electronic devices' } }),
        prisma.category.create({ data: { name: 'Fashion', description: 'Clothing and accessories' } }),
        prisma.category.create({ data: { name: 'Sports', description: 'Sporting goods and equipment' } }),
        prisma.category.create({ data: { name: 'Home', description: 'Home and kitchen items' } })
    ]);
    // Create products (12 products across 4 categories)
    const products = [
        { name: 'Wireless Headphones', description: 'Premium noise-cancelling wireless headphones with 30-hour battery life', price: 199.99, stock: 50, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', categoryId: categories[0].id },
        { name: 'Smart Watch', description: 'Fitness tracking smartwatch with heart rate monitor and GPS', price: 299.99, stock: 30, imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', categoryId: categories[0].id },
        { name: 'Bluetooth Speaker', description: 'Portable waterproof Bluetooth speaker with 360° sound', price: 79.99, stock: 100, imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', categoryId: categories[0].id },
        { name: 'Classic Denim Jacket', description: 'Timeless denim jacket with a modern slim fit', price: 89.99, stock: 40, imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', categoryId: categories[1].id },
        { name: 'Leather Sneakers', description: 'Handcrafted genuine leather sneakers, comfortable for all-day wear', price: 129.99, stock: 60, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', categoryId: categories[1].id },
        { name: 'Wool Beanie', description: 'Soft merino wool beanie, perfect for cold weather', price: 29.99, stock: 150, imageUrl: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=400', categoryId: categories[1].id },
        { name: 'Yoga Mat', description: 'Non-slip exercise yoga mat with carrying strap, 6mm thick', price: 39.99, stock: 80, imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400', categoryId: categories[2].id },
        { name: 'Running Shoes', description: 'Lightweight running shoes with responsive cushioning', price: 149.99, stock: 45, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', categoryId: categories[2].id },
        { name: 'Dumbbell Set', description: 'Adjustable dumbbell set, 5-25 lbs per hand', price: 199.99, stock: 25, imageUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400', categoryId: categories[2].id },
        { name: 'Ceramic Coffee Mug Set', description: 'Set of 4 handmade ceramic mugs, microwave safe', price: 34.99, stock: 120, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', categoryId: categories[3].id },
        { name: 'Scented Candle', description: 'Hand-poured soy wax candle with lavender vanilla scent', price: 24.99, stock: 200, imageUrl: 'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=400', categoryId: categories[3].id },
        { name: 'Stainless Steel Water Bottle', description: 'Double-wall insulated water bottle, keeps drinks cold 24h or hot 12h', price: 44.99, stock: 90, imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', categoryId: categories[3].id }
    ];
    await Promise.all(products.map(p => prisma.product.create({ data: p })));
    // Create test users
    const passwordHash = await bcryptjs_1.default.hash('password123', SALT_ROUNDS);
    await prisma.user.create({
        data: {
            username: 'testuser',
            email: 'test@example.com',
            passwordHash,
            cart: { create: {} }
        }
    });
    console.log('Database seeded successfully!');
    console.log(`- ${categories.length} categories`);
    console.log(`- ${products.length} products`);
    console.log(`- 1 test user (test@example.com / password123)`);
}
main()
    .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
})
    .finally(async () => await prisma.$disconnect());
//# sourceMappingURL=seed.js.map