# 本地 LLM 编程能力测评 — 全栈电商 MVP

## 测评背景

本仓库记录了一次对本地部署大语言模型**全栈编程能力**的深度测评。相较于俄罗斯方块（纯前端），本次测评要求模型同时覆盖前端、后端 API、数据库设计四个维度，更接近真实工程场景。

测评使用 **Claude Code v2.1.160** 作为 Coding Agent，以 **oMLX** 在 Apple Silicon 上进行本地推理，由 Claude Sonnet 4.6 担任 Code Reviewer，通过多轮 review 验证最终可运行性。

---

## 测试环境

| 项目 | 配置 |
|------|------|
| **硬件** | Apple M5 Max · 128 GB 统一内存 |
| **推理平台** | oMLX v0.4.0rc2 |
| **Coding Agent** | Claude Code v2.1.160 |
| **Reviewer** | Claude Sonnet 4.6 |
| **测评日期** | 2026-06-04 |
| **验收标准** | 六步用户流程全部可在浏览器中操作 |

---

## 测评题目

> 完整题目见 [REQUIREMENT.md](./REQUIREMENT.md)

### 核心要求

实现一个支持以下**完整用户流程**的电商系统：

1. 用户注册 / 登录（JWT 认证，密码 bcrypt 加密）
2. 浏览商品列表（支持分页）
3. 查看商品详情
4. 将商品加入购物车 / 修改数量（持久化至数据库）
5. 提交订单（库存须在同一事务内真实扣减）
6. 查看我的订单列表及订单详情

### 一票否决项

- 密码明文存储
- 库存扣减不在事务内

### 隐藏考点（题目未明写，review 时重点检查）

- 购物车是否有数据库级别的唯一约束（防重复加购）
- 订单是否保存下单时的历史价格（不随商品价格变化）
- 事务顺序：验库存 → 建订单 → 扣库存 → 清购物车
- API 错误码语义是否正确（400/401/404/409）
- 登录错误是否暴露具体哪个字段错了

---

## 参测模型

### 1. Qwen3.5-122B-A10B-4bit

| 属性 | 值 |
|------|----|
| 类型 | VLM（MoE，激活参数约 10B） |
| 大小 | 68 GB（4bit 量化） |
| 推理速度 | ~41 tok/s |
| Context 窗口 | 262,144 tokens |
| 采样参数 | temp=0.6, top_p=0.95, top_k=20（官方 coding 推荐） |
| Thinking 模式 | 关闭 |
| 目录 | `Qwen3.5-122B-A10B-4bit/` |

**技术栈选择：**
- 前端：原生 JavaScript + Hash Router（无框架，零依赖）
- 后端：Node.js + Express + Prisma ORM
- 数据库：SQLite（开发）
- 容器：Docker Compose

**如何运行：**
```bash
cd Qwen3.5-122B-A10B-4bit
docker compose up
# 前端：http://localhost:3000
# 后端 API：http://localhost:3001
```

或本地启动：
```bash
# 后端
cd backend && npm install
npx prisma migrate dev
node src/seed.js
npm start

# 前端（另开终端）
cd frontend && npm install && npm start
```

**测评结果：** 历经 **2 轮** code review，**0 次谎报**，主动使用 Playwright 进行 E2E 验证，通过验收。

**六步流程验收（Playwright E2E）：**

| 步骤 | 状态 |
|------|:----:|
| 用户注册 / 登录 | ✅ |
| 浏览商品列表（分页） | ✅ |
| 查看商品详情 | ✅ |
| 购物车（持久化，合并数量） | ✅ |
| 提交订单（库存扣减） | ✅ |
| 查看订单列表及详情 | ✅ |

**已实现的加分项：**
- 商品搜索（关键词）✅
- 商品分类筛选 ✅
- 订单取消 + 库存回滚 ✅
- Docker Compose 一键启动 ✅

**后端亮点：**

| 检查项 | 状态 | 说明 |
|--------|:----:|------|
| 密码 bcrypt 加密 | ✅ | salt rounds=10 |
| JWT 认证 | ✅ | 7天有效期，环境变量配置 |
| 登录错误不暴露字段 | ✅ | 统一返回 "Invalid email or password" |
| 购物车数据库唯一约束 | ✅ | `@@unique([cartId, productId])` |
| 订单历史价格 | ✅ | `OrderItem.price` 独立字段 |
| 库存扣减事务 | ✅ | `prisma.$transaction(async tx => {...})` |
| 库存不足 409 | ✅ | 错误码语义正确 |
| 订单取消回滚库存 | ✅ | 事务内完成 |
| API 错误码规范 | ✅ | 400/401/404/409/500 正确使用 |

**Bug 修复记录：**

| 轮次 | 问题 | 修复 | 状态 |
|------|------|------|:----:|
| R1 | PrismaClient 每个路由文件各自实例化 | 创建 `src/lib/prisma.js` 全局单例，用 `globalThis` 防 HMR 重复实例化 | ✅ 主动修复 |

> 模型在收到 Round 1 review 后**主动修复**，未被要求才修，并自行更新了 CODE_REVIEW.md。

**oMLX 运行统计：**

| 指标 | 值 |
|------|----|
| 总 Prefill Tokens | 10.8M |
| 缓存命中 Tokens | 9,254,912 |
| 缓存效率 | 85.4% |
| Token Generation 速度 | 36.0 tok/s |
| 显存占用 | ~65.19 GB |

---

## 最终评分

| 维度 | 权重 | Qwen3.5-122B | Qwen3.6-35B |
|------|:----:|:------------:|:-----------:|
| 功能完整性（六步流程） | 30% | 30 | 30 |
| 数据库设计 | 20% | 19 | **20** |
| API 设计与错误处理 | 20% | 18 | **20** |
| 后端安全与正确性 | 20% | 18 | **19** |
| 代码质量与文档 | 10% | 9 | 9 |
| **总分** | **100%** | **94 / 100** | **98 / 100** |

> 评分由 Claude Sonnet 4.6 独立给出，不采用模型自评分数。

---

## 关键发现

**1. 全栈任务下模型质量差距更明显**

俄罗斯方块（纯前端）的 bug 多是逻辑实现细节，容易发现也容易修。电商系统要求模型同时理解业务逻辑（历史价格、购物车合并）、安全实践（bcrypt、JWT）和数据库事务——这些知识的深度和广度让小模型更容易露馅。

**2. Qwen3.5-122B 主动举一反三**

收到 Round 1 review 后，模型不仅修了被指出的 PrismaClient 单例问题，还主动同时修复了另一个关联的事务 API 问题（`$startTransaction` → `$transaction`），并自行将 CODE_REVIEW.md 更新为 Round 2。这与俄罗斯方块测评中小模型"只修被点名的那行"的行为形成鲜明对比。

**3. 隐藏考点通过率高**

历史价格保存（`OrderItem.price`）、购物车数据库唯一约束（`@@unique`）、事务顺序正确性——这三个题目未明写的考点全部做对，说明模型具备真实的业务理解能力，不是在套模板。

**4. 两个模型在全栈任务中均表现出色**

Qwen3.5-122B（94分）和 Qwen3.6-35B（98分）都通过了验收，代码质量远超纯前端测评中的小模型。电商系统的隐藏考点（历史价格、DB 唯一约束、事务顺序）对两者来说都不是问题。

**5. Qwen3.6-35B 在全栈任务中反超**

在俄罗斯方块测评中，35B 因重构代码引入 4 个新 bug 表现欠佳（60分）。但在电商任务中，它的 Category 规范化设计、DB 索引、JWT Refresh Token、全栈 TypeScript 使其得分（98分）高于 Qwen3.5-122B（94分）。任务类型影响模型发挥。

---

## 仓库结构

```
local-llm-shoping-mvp-test/
├── README.md                              # 本文件
├── REQUIREMENT.md                         # 完整测评题目
├── Qwen3.5-122B-A10B-4bit/               # Qwen3.5-122B 的代码（✅ 通过验收）
│   ├── CODE_REVIEW.md                     # 2轮 code review 记录
│   ├── docker-compose.yml                 # 一键启动配置
│   ├── backend/
│   │   ├── src/
│   │   │   ├── server.js                  # Express 入口
│   │   │   ├── lib/prisma.js              # PrismaClient 全局单例
│   │   │   ├── middleware/auth.js         # JWT 认证中间件
│   │   │   ├── routes/
│   │   │   │   ├── auth.js               # 注册/登录
│   │   │   │   ├── products.js           # 商品列表/详情/搜索/分类
│   │   │   │   ├── cart.js               # 购物车 CRUD
│   │   │   │   └── orders.js             # 下单/查询/取消
│   │   │   └── seed.js                   # 初始化10件商品
│   │   └── prisma/schema.prisma          # 数据库 schema（含所有模型和关系）
│   └── frontend/
│       └── src/
│           ├── router.js                  # Hash Router（含动态路由）
│           ├── api.js                     # API 请求封装
│           └── pages/
│               ├── auth.js               # 登录/注册页
│               ├── products.js           # 商品列表/详情页
│               ├── cart.js               # 购物车页
│               └── orders.js             # 订单页
└── Qwen3.6-35B-A3B-MLX-8bit/             # Qwen3.6 实现
    ├── docker-compose.yml                 # 一键启动配置
    ├── backend/                           # Express + TypeScript + Prisma
    │   ├── src/
    │   │   ├── index.ts                   # Express 入口
    │   │   ├── lib/db.ts                  # PrismaClient 全局单例
    │   │   ├── middleware/auth.ts          # JWT 认证中间件
    │   │   ├── routes/                    # auth, products, cart, orders
    │   │   └── seed.ts                    # 12件商品 + 4分类 + 测试用户
    │   └── prisma/schema.prisma           # 数据库 schema
    └── frontend/                          # React 19 + Vite + TypeScript
        ├── src/
        │   ├── App.tsx                    # 路由布局
        │   ├── api/                       # API client + types
        │   ├── pages/                     # 7个页面
        │   ├── components/                # Header, ProductCard, Pagination
        │   └── styles/global.css          # 响应式样式
```

---

## Qwen3.6-35B-A3B-MLX-8bit 实现

### 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 + Vite + TypeScript |
| 后端 | Express.js + TypeScript |
| 数据库 | SQLite (Prisma ORM) |
| 认证 | JWT (access + refresh tokens) |

### 如何运行

```bash
cd Qwen3.6-35B-A3B-MLX-8bit

# Docker Compose（推荐）
docker compose up --build
# 前端: http://localhost:3000
# 后端: http://localhost:3001

# 或本地开发
cd backend && npm install && npx prisma migrate dev && npm run dev
cd ../frontend && npm install && npm run dev
```

### 测试账号

```
Email: test@example.com
Password: password123
```

### API 接口一览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 → access + refresh token |
| POST | `/api/auth/refresh` | 刷新 token |
| GET | `/api/products?page&limit&search&category` | 商品列表（分页/搜索/分类） |
| GET | `/api/products/:id` | 商品详情 |
| GET | `/api/cart` | 购物车 |
| POST/PUT/DELETE | `/api/cart/items/:productId` | 增删改购物车 |
| POST | `/api/orders` | 下单（事务扣库存） |
| GET | `/api/orders` | 订单列表 |
| GET/POST | `/api/orders/:id[/cancel]` | 订单详情 / 取消订单 |

### 验收检查

| 检查项 | 状态 |
|--------|:----:|
| 用户注册/登录 | ✅ |
| 商品列表（分页） | ✅ |
| 商品详情 | ✅ |
| 购物车（持久化，合并） | ✅ |
| 下单（事务扣库存） | ✅ |
| 订单列表/详情 | ✅ |
| 密码 bcrypt 加密 | ✅ |
| JWT + Refresh Token | ✅ |
| 订单历史价格 | ✅ |
| 商品搜索/分类 | ✅ |
| 订单取消+库存回滚 | ✅ |
| Docker Compose | ✅ |
