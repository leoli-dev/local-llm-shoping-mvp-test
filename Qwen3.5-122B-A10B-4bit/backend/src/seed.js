import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const products = [
  { name: 'Wireless Headphones', description: 'Premium noise-canceling wireless headphones with 30-hour battery life', price: 199.99, stock: 50, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', category: 'electronics' },
  { name: 'Smart Watch', description: 'Fitness tracking smartwatch with heart rate monitor and GPS', price: 299.99, stock: 30, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', category: 'electronics' },
  { name: 'Leather Backpack', description: 'Genuine leather backpack with laptop compartment', price: 149.99, stock: 25, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', category: 'fashion' },
  { name: 'Running Shoes', description: 'Lightweight performance running shoes with cushioned sole', price: 129.99, stock: 40, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', category: 'sports' },
  { name: 'Coffee Maker', description: 'Programmable drip coffee maker with thermal carafe', price: 89.99, stock: 20, image: 'https://images.unsplash.com/photo-1517080315814-93b98b9ee196?w=400', category: 'home' },
  { name: 'Mechanical Keyboard', description: 'RGB backlit mechanical keyboard with Cherry MX switches', price: 159.99, stock: 35, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400', category: 'electronics' },
  { name: 'Sunglasses', description: 'Polarized UV protection sunglasses with metal frame', price: 79.99, stock: 45, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400', category: 'fashion' },
  { name: 'Yoga Mat', description: 'Non-slip eco-friendly yoga mat with carrying strap', price: 39.99, stock: 60, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400', category: 'sports' },
  { name: 'Desk Lamp', description: 'LED desk lamp with adjustable brightness and color temperature', price: 49.99, stock: 30, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', category: 'home' },
  { name: 'Bluetooth Speaker', description: 'Portable waterproof Bluetooth speaker with 12-hour battery', price: 69.99, stock: 55, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', category: 'electronics' },
  { name: 'Denim Jacket', description: 'Classic vintage-style denim jacket with button closure', price: 89.99, stock: 22, image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400', category: 'fashion' },
  { name: 'Water Bottle', description: 'Insulated stainless steel water bottle keeps drinks cold for 24h', price: 24.99, stock: 80, image: 'https://images.unsplash.com/photo-1602143407151-011141951e49?w=400', category: 'sports' }
];

async function seed() {
  try {
    await prisma.$connect();

    await prisma.user.deleteMany();
    await prisma.product.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();

    const hashedPassword = await bcrypt.hash('password123', 10);

    const user1 = await prisma.user.create({
      data: { username: 'john', email: 'john@example.com', password: hashedPassword }
    });

    const user2 = await prisma.user.create({
      data: { username: 'jane', email: 'jane@example.com', password: hashedPassword }
    });

    await prisma.product.createMany({ data: products });

    await prisma.cart.create({
      data: {
        userId: user1.id,
        items: {
          create: [
            { productId: 1, quantity: 2 },
            { productId: 3, quantity: 1 }
          ]
        }
      }
    });

    await prisma.order.create({
      data: {
        userId: user1.id,
        status: 'pending',
        total: 449.97,
        items: {
          create: [
            { productId: 2, quantity: 1, price: 299.99 },
            { productId: 5, quantity: 1, price: 89.99 },
            { productId: 7, quantity: 1, price: 79.99 }
          ]
        }
      }
    });

    console.log('Seed completed successfully!');
    console.log('- Users: john@example.com, jane@example.com (password: password123)');
    console.log('- Products: 12 items added');
    console.log('- Sample cart: john has 2 items in cart');
    console.log('- Sample order: john has 1 pending order');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
