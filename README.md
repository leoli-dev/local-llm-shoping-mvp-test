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

### 2. Qwen3.6-35B-A3B-MLX-8bit

| 属性 | 值 |
|------|----|
| 类型 | LLM（MoE，激活参数约 3B） |
| 大小 | ~35.51 GB（8bit 量化） |
| 推理速度 | ~60.1 tok/s |
| Context 窗口 | 128,000 tokens |
| 采样参数 | 默认参数 |
| Thinking 模式 | 关闭 |
| 目录 | `Qwen3.6-35B-A3B-MLX-8bit/` |

**技术栈选择：**
- 前端：React 19 + Vite + TypeScript + React Router v7
- 后端：Node.js + Express + TypeScript + Prisma ORM
- 数据库：SQLite（开发）
- 认证：JWT（access token 7天 + refresh token 30天，双 secret）
- 容器：Docker Compose + Nginx（前端静态服务）

**如何运行：**
```bash
cd Qwen3.6-35B-A3B-MLX-8bit
docker compose up --build
# 前端：http://localhost:3000
# 后端 API：http://localhost:3001
```

或本地启动：
```bash
# 后端
cd backend && npm install
npx prisma migrate dev
npm run seed
npm run dev

# 前端（另开终端）
cd frontend && npm install && npm run dev
```

**测试账号：**
```
Email: test@example.com
Password: password123
```

**测评结果：** 历经 **1 轮** code review，**4 次修复**，通过验收。

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
- JWT Refresh Token（access 7天 + refresh 30天）✅
- TypeScript 全栈（前端 + 后端）✅

**后端亮点：**

| 检查项 | 状态 | 说明 |
|--------|:----:|------|
| 密码 bcrypt 加密 | ✅ | salt rounds=10 |
| JWT 认证 | ✅ | access token 7天，环境变量配置 |
| JWT Refresh Token | ✅ | 30天有效期，独立 secret，前端 401 自动续签 |
| 登录错误不暴露字段 | ✅ | 统一返回 "Invalid email or password" |
| 购物车数据库唯一约束 | ✅ | `@@unique([cartId, productId])` |
| 订单双历史快照 | ✅ | `OrderItem.productPrice` + `productName`（比 122B 更完整） |
| 库存扣减事务 | ✅ | `prisma.$transaction(async tx => {...})` |
| 库存不足 409 | ✅ | 含商品名和可用数量的详细错误信息 |
| 订单取消回滚库存 | ✅ | 事务内 `increment` 回滚 |
| Category 规范化 | ✅ | 独立 Category 表（外键关联，vs 122B 的字符串字段） |
| 数据库索引 | ✅ | `@@index([categoryId])` + `@@index([name])` 加速查询 |
| API 错误码规范 | ✅ | 400/401/404/409/500 正确使用 |
| 全局错误处理 | ✅ | Express error handler 兜底，防止堆栈信息泄露 |

**Bug 修复记录：**

| 轮次 | 问题 | 修复 | 状态 |
|------|------|------|:----:|
| R1 | 代码放错目录 | 移动 `backend/`, `frontend/`, `docker-compose.yml` 到 `Qwen3.6-35B-A3B-MLX-8bit/` | ✅ |
| R1 | Header JWT decode 失败 | 修复 URL-safe base64 解码（`-` → `+`, `_` → `/`） | ✅ 主动发现 |
| R1 | 搜索 API 500 错误 | 移除 Prisma `mode: 'insensitive'`（SQLite 不支持） | ✅ |
| R1 | 未完成前端 UI 验证 | 补充 Playwright E2E 验证六步完整流程 | ✅ |

**oMLX 运行统计：**

| 指标 | 值 |
|------|----|
| 总 Prefill Tokens | 11.7M |
| 缓存命中 Tokens | 10.3M |
| 缓存效率 | 88.0% |
| Token Generation 速度 | **60.1 tok/s** |
| Prompt Processing 速度 | 1236.6 tok/s |
| 显存占用 | ~35.51 GB |

---

### 3. Qwen3.6-27B-UD-MLX-4bit

| 属性 | 值 |
|------|----|
| 类型 | LLM（MoE，激活参数约 3B） |
| 大小 | ~24.78 GB（4bit 量化） |
| 推理速度 | ~14.2 tok/s（极慢） |
| Context 窗口 | 128,000 tokens |
| 采样参数 | 默认参数 |
| Thinking 模式 | 关闭 |
| 目录 | `Qwen3.6-27B-UD-MLX-4bit/` |

**技术栈选择：**
- 前端：React 18 + Vite + TypeScript + React Router
- 后端：Node.js + Express + TypeScript
- 数据库：SQLite via **sql.js**（WebAssembly，内存数据库）
- 认证：JWT（24小时有效期，无 refresh token）
- 容器：无（未实现 Docker Compose）

**测评结果：** ❌ **测试中止，未通过验收。** 测试持续超过 5 小时，项目始终无法正常运行。

**根本原因分析：**

| 问题 | 严重程度 | 说明 |
|------|:--------:|------|
| sql.js 用于 Node.js 后端 | 致命 | sql.js 是为**浏览器**设计的 WebAssembly 版 SQLite，不适合服务端。数据库完全在内存中，每次写操作都需手动调用 `saveDatabase()` 持久化到磁盘，任何异常都会导致数据丢失 |
| React Router 路由参数读取错误 | 致命 | `ProductDetailPage` 和 `OrderDetailPage` 用 `window.location.pathname.split('/').pop()` 读取路由参数，而非 React Router 提供的 `useParams()`，导致详情页在直接访问或刷新时路由参数丢失 |
| `/api/auth/me` 缺少认证中间件 | 高 | `auth.routes.ts` 未挂载 `authenticateToken`，`_req.userId` 永远是 `undefined`，接口始终返回 404 |
| JWT 无效时返回 403 而非 401 | 高 | token 过期/无效应返回 401，403 表示"有效但无权限"。前端无法正确捕获 401 触发重登录流程 |
| CORS 硬编码 localhost:5173 | 中 | 只允许 Vite 开发端口，无法在 Docker 或其他环境运行 |
| 无 Docker Compose | 中 | 无法一键部署，启动流程完全依赖手动操作 |
| 所有页面塞入单个 App.tsx | 低 | 430 行的巨型文件，`queryAll`/`queryGet` 等 helper 在多个路由文件中重复定义 |
| ProductsPage 错误时 loading 不重置 | 低 | API 失败时 `setLoading(false)` 未调用，页面永久显示 "Loading..." |

**与通过模型的关键差距：**

| 方面 | Qwen3.5-122B ✅ | Qwen3.6-35B ✅ | Qwen3.6-27B ❌ |
|------|:---:|:---:|:---:|
| 数据库方案 | Prisma ORM | Prisma ORM | sql.js WASM |
| Docker Compose | ✅ | ✅ | ❌ |
| 前端页面结构 | 独立页面文件 | 独立页面文件 | 全塞 App.tsx |
| 路由参数读取 | `useParams()` | `useParams()` | `window.location` |
| JWT 失效状态码 | 401 | 401 | 403 |
| Token 生成速度 | 36.0 tok/s | 60.1 tok/s | **14.2 tok/s** |

**oMLX 运行统计：**

| 指标 | 值 |
|------|----|
| 总 Prefill Tokens | 12.8M |
| 缓存命中 Tokens | 11.3M |
| 缓存效率 | 88.5% |
| Token Generation 速度 | **14.2 tok/s**（约为 35B 的 1/4） |
| Prompt Processing 速度 | 319.1 tok/s |
| 显存占用 | ~24.78 GB |
| 总测试时长 | >5 小时（中止） |

---

## 最终评分

| 维度 | 权重 | Qwen3.5-122B | Qwen3.6-35B | Qwen3.6-27B |
|------|:----:|:------------:|:-----------:|:-----------:|
| 功能完整性（六步流程） | 30% | 30 | **30** | —（未完成） |
| 数据库设计 | 20% | 19 | **20** | — |
| API 设计与错误处理 | 20% | 18 | **20** | — |
| 后端安全与正确性 | 20% | 18 | **19** | — |
| 代码质量与文档 | 10% | 9 | 9 | — |
| **总分** | **100%** | **94 / 100** | **98 / 100** | **❌ DNF** |

> 评分由 Claude Sonnet 4.6 独立给出，不采用模型自评分数。Qwen3.6-27B 因测试超时中止，不计入评分排名。

---

## 关键发现

**1. 全栈任务下模型质量差距更明显**

俄罗斯方块（纯前端）的 bug 多是逻辑实现细节，容易发现也容易修。电商系统要求模型同时理解业务逻辑（历史价格、购物车合并）、安全实践（bcrypt、JWT）和数据库事务——这些知识的深度和广度让小模型更容易露馅。

**2. Qwen3.5-122B 主动举一反三**

收到 Round 1 review 后，模型不仅修了被指出的 PrismaClient 单例问题，还主动同时修复了另一个关联的事务 API 问题（`$startTransaction` → `$transaction`），并自行将 CODE_REVIEW.md 更新为 Round 2。这与俄罗斯方块测评中小模型"只修被点名的那行"的行为形成鲜明对比。

**3. 隐藏考点通过率高**

历史价格保存（`OrderItem.price`）、购物车数据库唯一约束（`@@unique`）、事务顺序正确性——这三个题目未明写的考点全部做对，说明 122B 和 35B 具备真实的业务理解能力，不是在套模板。

**4. 通过验收的两个模型均表现出色**

Qwen3.5-122B（94分）和 Qwen3.6-35B（98分）都通过了验收，代码质量远超纯前端测评中的小模型。电商系统的隐藏考点（历史价格、DB 唯一约束、事务顺序）对两者来说都不是问题。

**5. Qwen3.6-35B 在全栈任务中反超**

在俄罗斯方块测评中，35B 因重构代码引入 4 个新 bug 表现欠佳（60分）。但在电商任务中，它的 Category 规范化设计、DB 索引、JWT Refresh Token、全栈 TypeScript 使其得分（98分）高于 Qwen3.5-122B（94分）。任务类型影响模型发挥。

**6. Qwen3.6-27B 的失败揭示了"工具选型"是关键门槛**

27B 的核心错误是用 sql.js（浏览器端 WASM 数据库）做服务端存储，暴露了对 Node.js 生态的理解不足。相比之下，122B 和 35B 都直接选择了 Prisma ORM，说明在全栈任务中，**正确的工具选型能力**比具体的实现细节更早决定成败。此外，27B 仅 14.2 tok/s 的生成速度（约为 35B 的四分之一）也导致 5 小时内无法完成足够多的调试迭代。

---

## 仓库结构

```
local-llm-shoping-mvp-test/
├── README.md                              # 本文件
├── REQUIREMENT.md                         # 完整测评题目
├── Qwen3.5-122B-A10B-4bit/               # Qwen3.5-122B 的代码（✅ 通过验收，94分）
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
├── Qwen3.6-35B-A3B-MLX-8bit/             # Qwen3.6-35B 的代码（✅ 通过验收，98分）
    ├── CODE_REVIEW.md                     # 1轮 code review 记录
    ├── docker-compose.yml                 # 一键启动配置
    ├── backend/
    │   ├── src/
    │   │   ├── index.ts                   # Express 入口
    │   │   ├── lib/db.ts                  # PrismaClient 全局单例
    │   │   ├── middleware/auth.ts          # JWT 认证中间件（含 refresh secret）
    │   │   ├── routes/
    │   │   │   ├── auth.ts               # 注册/登录/refresh token/logout
    │   │   │   ├── products.ts           # 商品列表/详情/搜索/分类
    │   │   │   ├── cart.ts               # 购物车 CRUD（upsert 合并数量）
    │   │   │   └── orders.ts             # 下单/查询/取消
    │   │   └── seed.ts                   # 12件商品 + 4分类 + 测试用户
    │   └── prisma/schema.prisma          # 数据库 schema（含 Category 表和索引）
    └── frontend/
        └── src/
            ├── App.tsx                    # React Router 路由布局
            ├── api/
            │   ├── client.ts             # API client（含 401 自动续签逻辑）
            │   └── types.ts              # TypeScript 类型定义
            ├── hooks/useAuth.ts          # 认证状态 hook
            ├── components/
            │   ├── Header.tsx            # 导航栏（含用户名/购物车/订单）
            │   ├── ProductCard.tsx       # 商品卡片组件
            │   └── Pagination.tsx        # 分页组件
            ├── pages/
            │   ├── Login.tsx             # 登录页
            │   ├── Register.tsx          # 注册页
            │   ├── ProductList.tsx       # 商品列表（搜索/分类/分页）
            │   ├── ProductDetail.tsx     # 商品详情页
            │   ├── Cart.tsx              # 购物车页
            │   ├── OrdersList.tsx        # 订单列表页
            │   └── OrderDetail.tsx       # 订单详情页
            └── styles/global.css         # 响应式全局样式
└── Qwen3.6-27B-UD-MLX-4bit/             # Qwen3.6-27B 的代码（❌ 测试中止，DNF）
    ├── README.md                          # 模型生成的说明文档
    ├── backend/
    │   └── src/
    │       ├── index.ts                   # Express 入口（CORS 硬编码 5173）
    │       ├── database/init.ts           # sql.js WASM 初始化（致命选型错误）
    │       ├── middleware/auth.ts         # JWT 认证（错误码 403 而非 401）
    │       ├── routes/
    │       │   ├── auth.routes.ts        # 注册/登录（/me 缺少认证中间件）
    │       │   ├── products.routes.ts    # 商品列表/详情
    │       │   ├── cart.routes.ts        # 购物车 CRUD
    │       │   └── orders.routes.ts      # 下单/查询/取消
    │       └── seed/products.ts          # 12件商品 + 4分类
    └── frontend/
        └── src/
            ├── App.tsx                    # 所有页面组件塞入单文件（430行）
            ├── api.ts                     # API client
            └── contexts/AuthContext.tsx   # 认证状态管理
```
