/**
 * Seed script: populates the database with categories and sample products.
 * Run with: npm run seed
 */

import initDatabase, { getDb, saveDatabase } from '../database/init';

async function seed() {
  console.log('Initializing database...');
  await initDatabase();
  const db = getDb();

  // Check if already seeded
  console.log('Checking existing products...');
  const countStmt = db.prepare('SELECT COUNT(*) FROM products');
  countStmt.bind();
  countStmt.step();
  const countRow = countStmt.get();
  countStmt.free();

  if ((countRow![0] as number) > 0) {
    console.log(`Products already seeded. Skipping.`);
    process.exit(0);
  }

  // Insert categories
  console.log('Inserting categories...');
  const categories = [
    { name: 'Electronics', description: 'Phones, laptops, and gadgets' },
    { name: 'Clothing', description: 'Apparel and accessories' },
    { name: 'Home & Kitchen', description: 'Furniture and kitchenware' },
    { name: 'Books', description: 'Physical and digital books' },
  ];

  for (const cat of categories) {
    console.log(`  Inserting category: ${cat.name}`);
    db.run('INSERT INTO categories (name, description) VALUES (?, ?)', [cat.name, cat.description]);
  }

  // Insert 12 sample products
  console.log('Inserting products...');
  const products = [
    { name: 'Smartphone X1', description: 'Latest flagship smartphone with 6.7" AMOLED display, 128GB storage, and triple camera system.', price: 69999, stock: 50, image_url: 'https://placehold.co/400x400/1a1a2e/fff?text=Smartphone', category: 'Electronics' },
    { name: 'Laptop Pro 15', description: 'Powerful 15-inch laptop with M3 chip, 16GB RAM, 512GB SSD. Perfect for professionals.', price: 129999, stock: 30, image_url: 'https://placehold.co/400x400/16213e/fff?text=Laptop', category: 'Electronics' },
    { name: 'Wireless Earbuds', description: 'True wireless earbuds with active noise cancellation and 30-hour battery life.', price: 19999, stock: 100, image_url: 'https://placehold.co/400x400/0f3460/fff?text=Earbuds', category: 'Electronics' },
    { name: 'Smart Watch Ultra', description: 'Premium smartwatch with health monitoring, GPS, and water resistance to 100m.', price: 39999, stock: 40, image_url: 'https://placehold.co/400x400/533483/fff?text=Watch', category: 'Electronics' },
    { name: 'Bluetooth Speaker', description: 'Portable waterproof speaker with 360° sound and 20-hour playtime.', price: 7999, stock: 80, image_url: 'https://placehold.co/400x400/e94560/fff?text=Speaker', category: 'Electronics' },
    { name: 'USB-C Hub', description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and power delivery.', price: 4999, stock: 120, image_url: 'https://placehold.co/400x400/0a1931/fff?text=Hub', category: 'Electronics' },
    { name: 'Cotton T-Shirt', description: 'Premium organic cotton t-shirt, available in multiple colors. Comfortable everyday wear.', price: 2999, stock: 200, image_url: 'https://placehold.co/400x400/2ec4b6/fff?text=T-Shirt', category: 'Clothing' },
    { name: 'Denim Jacket', description: 'Classic denim jacket with a modern slim fit. Perfect for layering in any season.', price: 5999, stock: 60, image_url: 'https://placehold.co/400x400/ff6b6b/fff?text=Jacket', category: 'Clothing' },
    { name: 'Running Shoes', description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper.', price: 8999, stock: 75, image_url: 'https://placehold.co/400x400/ffd93d/333?text=Shoes', category: 'Clothing' },
    { name: 'Ceramic Coffee Mug', description: 'Handcrafted ceramic mug, 350ml capacity. Microwave and dishwasher safe.', price: 1999, stock: 150, image_url: 'https://placehold.co/400x400/6bcb77/fff?text=Mug', category: 'Home & Kitchen' },
    { name: 'Stainless Steel Water Bottle', description: 'Double-wall insulated water bottle, keeps drinks cold 24h or hot 12h. 750ml.', price: 3499, stock: 100, image_url: 'https://placehold.co/400x400/4d96ff/fff?text=Bottle', category: 'Home & Kitchen' },
    { name: 'JavaScript: The Good Parts', description: 'Classic programming book exploring the elegant parts of the JavaScript language.', price: 3999, stock: 45, image_url: 'https://placehold.co/400x400/ffb347/333?text=Book', category: 'Books' },
  ];

  for (const product of products) {
    console.log(`  Inserting product: ${product.name}`);
    const catStmt = db.prepare('SELECT id FROM categories WHERE name = ?');
    catStmt.bind([product.category]);
    catStmt.step();
    const catRow = catStmt.get();
    catStmt.free();

    const categoryId = catRow ? (catRow as unknown[])[0] : -1;

    db.run(
      'INSERT INTO products (name, description, price, stock, image_url, category_id) VALUES (?, ?, ?, ?, ?, ?)',
      [product.name, product.description, product.price, product.stock, product.image_url, categoryId]
    );
  }

  saveDatabase();
  console.log(`✅ Seeded ${categories.length} categories and ${products.length} products.`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
