import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/db';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

async function startServer() {
  const db = await initDB();
  
  // Seed data with categories and updated image URLs
  const seedProducts = [
    { name: 'Laptop', description: 'High performance laptop', price: 999.99, stock: 10, category: 'Electronics', image_url: 'https://placehold.co/150x150?text=Laptop' },
    { name: 'Smartphone', description: 'Latest gen smartphone', price: 699.99, stock: 20, category: 'Electronics', image_url: 'https://placehold.co/150x150?text=Smartphone' },
    { name: 'Headphones', description: 'Noise cancelling headphones', price: 199.99, stock: 30, category: 'Electronics', image_url: 'https://placehold.co/150x150?text=Headphones' },
    { name: 'Monitor', description: '4K Ultra HD Monitor', price: 299.99, stock: 15, category: 'Electronics', image_url: 'https://placehold.co/150x150?text=Monitor' },
    { name: 'Keyboard', description: 'Mechanical keyboard', price: 89.99, stock: 40, category: 'Peripherals', image_url: 'https://placehold.co/150x150?text=Keyboard' },
    { name: 'Mouse', description: 'Ergonomic wireless mouse', price: 49.99, stock: 50, category: 'Peripherals', image_url: 'https://placehold.co/150x150?text=Mouse' },
    { name: 'Webcam', description: '1080p HD Webcam', price: 59.99, stock: 25, category: 'Peripherals', image_url: 'https://placehold.co/150x150?text=Webcam' },
    { name: 'USB Hub', description: 'Multi-port USB-C hub', price: 39.99, stock: 60, category: 'Peripherals', image_url: 'https://placehold.co/150x150?text=USB+Hub' },
    { name: 'Desk Lamp', description: 'LED desk lamp with dimming', price: 24.99, stock: 100, category: 'Home', image_url: 'https://placehold.co/150x150?text=Desk+Lamp' },
    { name: 'Power Bank', description: '20000mAh fast charge power bank', price: 45.99, stock: 80, category: 'Electronics', image_url: 'https://placehold.co/150x150?text=Power+Bank' },
  ];

  const productCount = await db.get('SELECT COUNT(*) as count FROM products');
  if ((productCount as any).count === 0) {
    for (const p of seedProducts) {
      await db.run('INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)', 
        [p.name, p.description, p.price, p.stock, p.category, p.image_url]);
    }
    console.log('Database seeded with products');
  }

  app.use((req, res, next) => {
    (req as any).db = db;
    next();
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
