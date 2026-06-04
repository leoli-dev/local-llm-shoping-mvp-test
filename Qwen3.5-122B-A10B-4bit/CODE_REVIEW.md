# Code Review — Round 2

**总体评价：** MVP 已完成并通过 Playwright E2E 验证，所有核心功能正常工作。Round 1 的 PrismaClient 多实例问题已修复。

---

## ✅ 验收线：六步流程全部通过

Playwright E2E 已验证：
1. **用户注册/登录** ✅
2. **浏览商品列表（分页）** ✅
3. **查看商品详情** ✅
4. **购物车（持久化）** ✅
5. **提交订单（库存扣减）** ✅
6. **查看订单列表及详情** ✅

---

## Round 1 → Round 2 修复内容

### ✅ 已修复：PrismaClient 多实例问题

**之前的问题：**
每个路由文件各自实例化 `new PrismaClient()`，可能导致连接池问题

**修复方案：**
创建 `src/lib/prisma.js` 导出全局单例：

```javascript
// src/lib/prisma.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

所有路由文件改为：
```javascript
import { prisma } from '../lib/prisma.js';
```

### ✅ 已修复：订单创建事务 API

**之前的问题：**
`prisma.$startTransaction()` 在 Prisma 5.x 中不可用

**修复方案：**
改用 `prisma.$transaction(async (tx) => {...})` 交互式事务 API

---

## 后端亮点

**数据库设计（schema.prisma）**

- `CartItem` 有 `@@unique([cartId, productId])` 数据库层唯一约束 ✅
- `OrderItem` 保存下单时的历史价格 `price: Float` ✅
- Cascade delete 设置正确 ✅

**认证（auth.js）**

- bcrypt 加密，salt rounds=10 ✅
- 统一错误消息 `"Invalid email or password"` ✅
- 密码最短 6 位校验 ✅

**订单创建（orders.js）**

- 使用 `prisma.$transaction(async (tx) => {...})` 事务 ✅
- 库存验证 → 创建订单 → 扣减库存 → 清空购物车 ✅
- 库存不足返回 409，购物车为空返回 400 ✅
- 取消订单在事务内回滚库存 ✅

**商品接口（products.js）**

- 分页、关键词搜索、分类筛选 ✅
- `/categories` 独立端点 ✅

---

## ⚠️ 未修复（技术债务，MVP 可接受）

**1. 库存并发保护（SQLite 下可接受）**

事务内先 `SELECT` 再 `UPDATE`，没有行锁（`SELECT FOR UPDATE`）。SQLite 因文件锁天然串行，不会超卖；换 PostgreSQL 后高并发下理论上存在超卖风险。

**2. 前端无 TypeScript**

JS 原生写法，无类型保障。考题加分项。

---

## 总结

| 维度 | 评价 |
|------|------|
| 六步流程可用 | ✅ 全部通过 |
| 密码加密 | ✅ bcrypt |
| 历史价格保存 | ✅ OrderItem.price |
| 库存事务 | ✅ $transaction |
| 取消 + 回滚 | ✅ 含加分项 |
| 分类/搜索 | ✅ 含加分项 |
| Docker Compose | ✅ 含加分项 |
| API 错误码规范 | ✅ |
| PrismaClient 单例 | ✅ 已修复 |
| 并发超卖（PostgreSQL） | ⚠️ 低风险 |
| TypeScript | ❌ 未使用 |

**Round 2 结论：✅ 通过验收，所有核心功能正常，PrismaClient 单例问题已修复。**
