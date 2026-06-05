# 🛒 ShopMVP — 本地 LLM 全栈电商 MVP

由 **Qwen3.6-27B-UD-MLX-4bit** 模型生成的完整电商系统。

## 技术栈

| 层 | 技术 |
|---|---|
| **前端** | React 18 + TypeScript + Vite + React Router |
| **后端** | Node.js + Express + TypeScript |
| **数据库** | SQLite (sql.js WASM) |
| **认证** | JWT + bcryptjs |

## 快速启动

### 1. 启动后端

```bash
cd backend
npm install
npm run seed      # 初始化数据库并填充示例数据
npm run dev       # 启动开发服务器 (port 3001)
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev       # 启动开发服务器 (port 5173)
```

打开 http://localhost:5173 即可使用。

## 六步用户流程

1. **用户注册** → POST `/api/auth/register`
2. **浏览商品** → GET `/api/products` (支持分页、搜索)
3. **商品详情** → GET `/api/products/:id`
4. **加入购物车** → POST `/api/cart/items` (数据库持久化)
5. **提交订单** → POST `/api/orders` (事务性库存扣减)
6. **查看订单** → GET `/api/orders` + GET `/api/orders/:id`

## API 接口

### 认证
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 用户注册 (username, email, password) |
| POST | `/api/auth/login` | 用户登录 (email, password) → JWT |
| GET | `/api/auth/me` | 获取当前用户信息 (需认证) |

### 商品
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/products` | 商品列表 (分页, ?page=1&search=&category=) |
| GET | `/api/products/:id` | 商品详情 |
| GET | `/api/products/categories` | 分类列表 |

### 购物车
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/cart` | 当前用户购物车 |
| POST | `/api/cart/items` | 添加商品 (自动合并数量) |
| PUT | `/api/cart/items/:id` | 修改数量 |
| DELETE | `/api/cart/items/:id` | 移除商品 |

### 订单
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/orders` | 提交订单 (事务: 创建订单 + 扣减库存) |
| GET | `/api/orders` | 我的订单列表 (分页) |
| GET | `/api/orders/:id` | 订单详情 |
| POST | `/api/orders/:id/cancel` | 取消订单 (回滚库存) |

## 数据库表结构

```sql
users (id, username UNIQUE, email UNIQUE, password_hash, created_at)
categories (id, name UNIQUE, description)
products (id, name, description, price, stock, image_url, category_id FK)
cart_items (id, user_id FK, product_id FK, quantity, UNIQUE(user_id, product_id))
orders (id, user_id FK, total_amount, status CHECK(pending|cancelled), created_at)
order_items (id, order_id FK, product_id FK, product_name, quantity, unit_price, subtotal)
```

## 核心业务逻辑

### 订单创建流程
1. 查询用户购物车中的所有商品
2. 校验每件商品的库存是否充足
3. 开启数据库事务 (BEGIN TRANSACTION)
4. 创建订单记录 (INSERT INTO orders)
5. 为每个购物车商品创建订单项 (INSERT INTO order_items)，**保存下单时的价格**
6. 扣减商品库存 (UPDATE products SET stock = stock - quantity)
7. 清空购物车 (DELETE FROM cart_items)
8. 提交事务 (COMMIT) / 失败则回滚 (ROLLBACK)

### 安全措施
- **密码加密**: bcrypt (salt rounds = 12)，从不存储明文
- **JWT 认证**: 受保护接口验证 Bearer Token
- **事务保护**: 订单创建在同一事务中完成，防止超卖
- **库存校验**: 下单前检查所有商品库存，不足则拒绝

### 加分项实现
✅ 商品搜索 (按名称关键词)
✅ 商品分类 (支持按分类筛选)
✅ 订单取消 (pending 状态可取消，回滚库存)
✅ TypeScript (前后端均使用)
✅ 响应式前端

## 错误处理

| 状态码 | 说明 |
|---|---|
| 400 | 请求参数错误 |
| 401 | 未认证 / 凭证无效 |
| 403 | Token 无效或过期 |
| 404 | 资源不存在 |
| 409 | 冲突 (库存不足 / 用户名已存在) |
| 500 | 服务器内部错误 |

## 项目结构

```
├── README.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts              # 入口 + Express 配置
│       ├── database/init.ts      # 数据库初始化 (建表)
│       ├── middleware/auth.ts    # JWT 认证中间件
│       ├── routes/
│       │   ├── auth.routes.ts    # 注册 / 登录
│       │   ├── products.routes.ts # 商品 CRUD
│       │   ├── cart.routes.ts    # 购物车操作
│       │   └── orders.routes.ts  # 订单管理
│       └── seed/products.ts      # 示例数据填充
└── frontend/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx              # 入口
        ├── App.tsx               # 路由 + 页面组件
        ├── api.ts                # API 客户端
        ├── index.css             # 全局样式
        └── contexts/
            └── AuthContext.tsx   # 认证状态管理
```

## AI 辅助说明

本项目由 **Qwen3.6-27B-UD-MLX-4bit** 本地 LLM 全权生成，包括:
- 数据库设计与建表脚本
- 后端 RESTful API (含认证、事务)
- 前端 React SPA (含路由、状态管理)
- CSS 样式与响应式布局
