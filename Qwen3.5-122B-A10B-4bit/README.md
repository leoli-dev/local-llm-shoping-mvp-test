# ShopMVP - E-commerce Demo

A full-stack e-commerce MVP demonstrating a complete shopping experience with user authentication, product browsing, shopping cart, and order management.

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Node.js + Express.js
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens) + bcrypt
- **Deployment**: Docker Compose

## Features

### Core Functionality (6-Step User Flow)

1. **User Registration / Login**
   - Register with username, email, password
   - Password encrypted with bcrypt (10 rounds)
   - JWT token for session management

2. **Browse Products (with Pagination)**
   - View products in a responsive grid
   - Pagination (6 items per page)
   - Search by product name
   - Filter by category

3. **View Product Details**
   - Full product information
   - Stock availability
   - Add to cart from detail page

4. **Shopping Cart**
   - Add/remove items
   - Update quantities
   - Persistent cart (stored in database)
   - Real-time total calculation

5. **Submit Order**
   - Transaction-based order creation
   - Atomic inventory deduction
   - Stock validation before purchase

6. **View Orders**
   - Order history list
   - Order details with item breakdown
   - Cancel pending orders (inventory rollback)

## Project Structure

```
Qwen3.5-122B-A10B-4bit/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.js        # Auth endpoints
│   │   │   ├── cart.js        # Cart endpoints
│   │   │   ├── orders.js      # Order endpoints
│   │   │   └── products.js    # Product endpoints
│   │   ├── server.js          # Express app entry
│   │   └── seed.js            # Database seed script
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth.js        # Login/Register pages
│   │   │   ├── cart.js        # Cart page
│   │   │   ├── orders.js      # Orders pages
│   │   │   └── products.js    # Product pages
│   │   ├── api.js             # API client
│   │   ├── App.js             # Main app class
│   │   ├── router.js          # Router
│   │   ├── main.js            # Entry point
│   │   └── styles.css         # Styles
│   ├── index.html
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Getting Started

### Option 1: Docker Compose (Recommended)

```bash
# Navigate to project directory
cd /Users/leo/Code/local-llm-shoping-mvp-test/Qwen3.5-122B-A10B-4bit

# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Option 2: Local Development

**Backend Setup:**

```bash
cd backend

# Install dependencies
npm install

# Initialize database (creates tables)
npx prisma migrate dev --name init

# Seed initial data
npm run seed

# Start server
npm start
```

**Frontend Setup:**

```bash
cd frontend

# Install dependencies
npm install

# Start server
npm start
```

## Default Test Account

After seeding, you can use these credentials:

- **Email**: john@example.com
- **Password**: password123

## API Documentation

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Products

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | List products (paginated) | No |
| GET | `/api/products?search=query` | Search products | No |
| GET | `/api/products?category=name` | Filter by category | No |
| GET | `/api/products/categories` | Get all categories | No |
| GET | `/api/products/:id` | Get product details | No |

### Cart

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cart` | Get user's cart | Yes |
| POST | `/api/cart/items` | Add item to cart | Yes |
| PATCH | `/api/cart/items/:itemId` | Update item quantity | Yes |
| DELETE | `/api/cart/items/:itemId` | Remove item from cart | Yes |

### Orders

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/orders` | List user's orders | Yes |
| GET | `/api/orders/:id` | Get order details | Yes |
| POST | `/api/orders` | Create new order | Yes |
| PATCH | `/api/orders/:id/cancel` | Cancel order | Yes |

## Database Schema

### Users Table
- `id` (PK)
- `username` (unique)
- `email` (unique)
- `password` (hashed)
- `createdAt`

### Products Table
- `id` (PK)
- `name`
- `description`
- `price`
- `stock`
- `image` (URL)
- `category`
- `createdAt`

### Carts Table
- `id` (PK)
- `userId` (FK -> Users)
- `createdAt`
- `updatedAt`

### CartItems Table
- `id` (PK)
- `cartId` (FK -> Carts)
- `productId` (FK -> Products)
- `quantity`
- `createdAt`
- `updatedAt`

### Orders Table
- `id` (PK)
- `userId` (FK -> Users)
- `status` (pending/completed/cancelled)
- `total`
- `createdAt`
- `updatedAt`

### OrderItems Table
- `id` (PK)
- `orderId` (FK -> Orders)
- `productId` (FK -> Products)
- `quantity`
- `price` (snapshot at order time)
- `createdAt`

## Core Business Logic

### Order Creation & Inventory Deduction

Orders are created using a database transaction that ensures:

1. **Stock Validation**: Check all items have sufficient stock
2. **Order Creation**: Create order record with items (snapshot prices)
3. **Inventory Deduction**: Decrement product stock
4. **Cart Cleanup**: Remove items from cart

If any step fails, the entire transaction rolls back.

```javascript
// Transaction example (backend/src/routes/orders.js)
const client = await prisma.$startTransaction();

try {
  // 1. Validate stock
  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      throw new Error('Insufficient stock');
    }
  }

  // 2. Create order
  const order = await client.order.create({...});

  // 3. Deduct inventory
  for (const item of cart.items) {
    await client.product.update({
      where: { id: item.product.id },
      data: { stock: { decrement: item.quantity } }
    });
  }

  // 4. Clear cart
  await client.$commit();
} catch (error) {
  await client.$rollback();
}
```

### Password Security

- Passwords are hashed using bcrypt with 10 salt rounds
- Never stored in plain text
- Minimum 6 characters required

### JWT Authentication

- Tokens expire after 7 days
- Stored in localStorage on frontend
- Sent via Authorization header: `Bearer <token>`

## Error Handling

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict (e.g., insufficient stock) |
| 500 | Internal Server Error |

## AI Usage

This project was built with AI assistance:
- Code generation for backend routes and frontend pages
- CSS styling for responsive design
- Documentation generation
