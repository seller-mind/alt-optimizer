# Neon PostgreSQL 设置指南

AltOptimizer 使用 PostgreSQL 作为数据库，本地开发也可以使用 Neon 的免费云数据库。

## 1. 注册 Neon 账号

1. 访问 [https://neon.tech](https://neon.tech) 并注册
2. 使用 GitHub 账号登录（推荐）
3. 创建一个新的 Project（项目）

## 2. 获取数据库连接字符串

1. 在项目 Dashboard 中，点击 **Connection Details**
2. 复制 **Connection string**（连接字符串）
3. 格式类似：`postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb`

## 3. 创建连接池连接（必须）

Neon 支持 PgBouncer 连接池，用于生产环境。连接池连接字符串格式：

```
postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?pgbouncer=true
```

> **重要**：在 Vercel serverless 环境中，**必须**使用连接池连接（`?pgbouncer=true`），否则会因为连接数过多导致错误。

## 4. 配置环境变量

### 本地开发

在 `.env` 文件中设置：

```env
# 直接连接（用于 Prisma Migrate）
DATABASE_URL="postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb"

# 连接池连接（用于运行时的 Prisma 查询）
# 注意：Prisma 在运行时使用这个连接执行查询
DATABASE_URL_UNPOOLED="postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb"
```

### Vercel 生产环境

在 Vercel Dashboard 中设置环境变量：

```env
DATABASE_URL="postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?pgbouncer=true"
```

## 5. 运行数据库迁移

```bash
# 本地开发 - 应用迁移到本地 PostgreSQL
npx prisma migrate dev

# 或推送到远程 Neon 数据库
DATABASE_URL="<你的Neon连接字符串>" npx prisma migrate dev

# 生产环境 - 在 Vercel 部署时自动运行
# 由 build 脚本中的 prisma migrate deploy 执行
```

## 6. 连接池配置说明

| 环境 | 连接类型 | 说明 |
|------|---------|------|
| 本地开发 | 直接连接 | 使用 `DATABASE_URL` 不加 `?pgbouncer=true` |
| Vercel Serverless | 连接池连接 | 使用 `DATABASE_URL` 加 `?pgbouncer=true` |
| Prisma Migrate | 直接连接 | 迁移命令不支持连接池，需使用 `DATABASE_URL_UNPOOLED` |

## 7. 查看和管理数据

- 使用 Neon Console 的 **SQL Editor** 直接查询
- 或使用 Prisma Studio：`npx prisma studio`
- 或使用第三方工具：TablePlus, DBeaver, DataGrip 等

## 8. 故障排除

### 连接超时
- 确保使用连接池连接（`?pgbouncer=true`）
- 检查 Neon 控制台中的 **Connection Limits**

### 迁移失败
- 迁移需要直接连接，不要使用连接池连接
- 使用 `DATABASE_URL_UNPOOLED` 或临时去掉 `?pgbouncer=true`

### 连接数过多
- 减少 Vercel serverless 函数的并发实例数
- 确保 Prisma 使用单例模式（已在 `app/db.server.ts` 中实现）