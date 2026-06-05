# Shopping MVP - Gemma 4 Implementation

This is a full-stack e-commerce MVP implemented using React, Express, and SQLite.

## Tech Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide-react, Axios, React Router
- **Backend**: Node.js, Express, TypeScript, SQLite3
- **Authentication**: JWT, bcryptjs

## Local Startup Instructions

### 1. Backend
```bash
cd gemma-4-31b-it-8bit/backend
npm install
npm run dev
```
The server will start on `http://localhost:3001`. It will automatically create a `database.sqlite` file and seed it with 10 products.

### 2. Frontend
```bash
cd gemma-4-31b-it-8bit/frontend
npm install
npm run dev
```
The frontend will start on `http://localhost:5173` (or similar Vite port).

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user (username, email, password)
- `POST /api/auth/login`: Login and receive JWT token (email, password)

### Products
- `GET /api/products?page=1`: Get paginated list of products
- `GET /api/products/:id`: Get details of a specific product

### Cart (Protected)
- `GET /api/cart`: Get current user's cart
- `POST /api/cart/add`: Add product to cart (productId, quantity)
- `PUT /api/cart/update`: Update product quantity in cart (productId, quantity)

### Orders (Protected)
- `POST /api/orders`: Create order from cart (deducts stock, snapshots prices)
- `GET /api/orders`: Get all orders for the current user
- `GET /api/orders/:id`: Get details of a specific order

## Database Schema
- `users`: id, username, email, password (hashed)
- `products`: id, name, description, price, stock, image_url
- `cart_items`: id, user_id, product_id, quantity
- `orders`: id, user_id, total_amount, status, created_at
- `order_items`: id, order_id, product_id, quantity, price_at_purchase

## Core Business Logic
- **Inventory Management**: When an order is placed, the system uses a SQLite transaction to ensure that stock is deducted and the order is created atomically. If any item in the cart has insufficient stock, the entire transaction is rolled back.
- **Price Stability**: The `order_items` table stores `price_at_purchase`, ensuring that order history remains accurate even if product prices change in the future.
- **Authentication**: Passwords are encrypted using `bcryptjs` and session state is maintained via JWT in the `Authorization` header.
