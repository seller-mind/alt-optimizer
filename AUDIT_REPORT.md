# AltOptimizer 全面代码审计报告

**审计日期**: 2026-08-24  
**项目版本**: v1.0.0  
**技术栈**: Remix + Prisma + PostgreSQL (Neon) + Shopify API + OpenAI API  
**部署平台**: Vercel  
**线上地址**: https://alt-optimizer.vercel.app

---

## 问题汇总

| 严重程度 | 数量 |
|---------|------|
| 🔴 Critical | 5 |
| 🟠 High | 6 |
| 🟡 Medium | 7 |
| 🟢 Low | 5 |
| **总计** | **23** |

---

## 🔴 Critical 级别问题

### C-01: Review 页面存在跨店铺数据泄露

**文件**: `app/routes/app.review.tsx` 第 52-66 行

**问题描述**: Review 页面的 loader 查询 `productImages` 时**未按 shopId 过滤**，导致任何已安装店铺的商家都能看到**所有店铺**的 AI 生成 alt text、图片数据。这是一个严重的多租户数据隔离问题。

```typescript
// 当前代码 — 缺少 product.shopId 过滤
const imagesWhere: Record<string, unknown> = {
  altTextAi: { not: null },
};
// ...
const images = await prisma.productImage.findMany({
  where: imagesWhere,  // ❌ 没有按 shopId 过滤！
  // ...
});

// allWithAi 和 statusCounts 同样没有 shopId 过滤
const allWithAi = await prisma.productImage.count({
  where: { altTextAi: { not: null } },  // ❌ 全库查询
});
```

**修复建议**:
```typescript
const imagesWhere: Record<string, unknown> = {
  altTextAi: { not: null },
  product: { shopId: shop.id },  // ✅ 添加店铺隔离
};

const allWithAi = await prisma.productImage.count({
  where: { altTextAi: { not: null }, product: { shopId: shop.id } },  // ✅
});

const counts = await prisma.productImage.groupBy({
  by: ["status"],
  where: { altTextAi: { not: null }, product: { shopId: shop.id } },  // ✅
  _count: true,
});
```

---

### C-02: Review 页面 approve/edit action 未验证图片归属

**文件**: `app/routes/app.review.tsx` 第 125-170 行、第 197-225 行

**问题描述**: approve 和 edit 操作仅通过 `imageId` 查找图片，未验证该图片是否属于当前店铺的 product。恶意用户可构造请求修改其他店铺的 alt text 并通过自己的 Shopify admin client 写入到其他店铺的图片（虽然 admin client 不同会失败，但存在信息泄露和逻辑混乱风险）。

```typescript
// approve action — 仅用 id 查找，未校验归属
const image = await prisma.productImage.findUnique({
  where: { id: imageId },  // ❌ 没有验证是否属于当前 shop
});
```

**修复建议**:
```typescript
const image = await prisma.productImage.findFirst({
  where: {
    id: imageId,
    product: { shopId: shop.id },  // ✅ 验证归属
  },
});
if (!image || !image.altTextAi) continue;
```

---

### C-03: Webhook HMAC 签名未实际验证

**文件**: `app/routes/webhooks.tsx` 第 14-21 行

**问题描述**: Webhook 处理代码仅检查 `x-shopify-hmac-sha256` header 是否存在，但**从未验证其签名值**。攻击者可伪造 webhook 请求，触发店铺卸载、数据删除等操作。

```typescript
const hmac = request.headers.get("x-shopify-hmac-sha256") || "";
if (!hmac) {  // ❌ 仅检查是否存在，未验证签名
  return json({ error: "Missing HMAC" }, { status: 401 });
}
// ... 直接处理 payload，未验证
```

**修复建议**: 应使用 Shopify SDK 的 `authenticate.webhook(request)` 进行验证，或手动使用 HMAC SHA256 验证：

```typescript
import { createHmac, timingSafeEqual } from "crypto";

const body = await request.text();
const hmac = request.headers.get("x-shopify-hmac-sha256") || "";
const secret = process.env.SHOPIFY_API_SECRET!;
const hash = createHmac("sha256", secret).update(body, "utf8").digest("base64");

const hmacBuffer = Buffer.from(hmac, "base64");
const hashBuffer = Buffer.from(hash, "base64");
if (hmacBuffer.length !== hashBuffer.length || !timingSafeEqual(hmacBuffer, hashBuffer)) {
  return json({ error: "Invalid HMAC" }, { status: 401 });
}
```

---

### C-04: Prisma 单例模式在 Vercel Serverless 环境下失效

**文件**: `app/db.server.ts` 第 7-11 行

**问题描述**: 代码仅在 `NODE_ENV !== "production"` 时缓存 Prisma 实例到全局变量。在 Vercel Serverless (production) 中，每次函数调用都会创建新的 PrismaClient，导致**数据库连接池耗尽**。Neon PostgreSQL 的连接数有限，大量并发请求会触发连接数上限错误。

```typescript
const prisma = globalThis.__prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;  // ❌ production 时不缓存！
}
```

**修复建议**:
```typescript
const prisma = globalThis.__prisma ?? new PrismaClient();
globalThis.__prisma = prisma;  // ✅ 所有环境都缓存
```

此外，建议添加连接池配置：
```typescript
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  // Neon serverless 建议限制连接池
});
```

---

### C-05: `onboardingStep` 字段不存在于数据库 Schema

**文件**: `app/routes/app._index.tsx` 第 45、55、70、79 行 & `prisma/schema.prisma`

**问题描述**: Dashboard 页面（`app._index.tsx`）多处读写 `shop.onboardingStep` 字段，但 `prisma/schema.prisma` 中的 `Shop` model 完全**没有定义此字段**。这会导致 Prisma 在运行时抛出 `Unknown arg 'onboardingStep'` 错误，Dashboard 页面**完全不可用**。

```typescript
// app._index.tsx 中使用了不存在的字段
const showOnboarding = isNewUser || shop.onboardingStep !== "completed";  // ❌
data: { onboardingStep: "completed" },  // ❌
data: { onboardingStep: step },  // ❌
```

**修复建议**: 在 `prisma/schema.prisma` 的 `Shop` model 中添加字段并执行迁移：

```prisma
model Shop {
  // ... 现有字段
  onboardingStep String? @default("welcome") @map("onboarding_step")
}
```

然后执行 `npx prisma migrate dev --name add_onboarding_step`。

---

## 🟠 High 级别问题

### H-01: Webhook 路由配置与 Remix 路由文件不匹配

**文件**: `app/shopify.server.ts` 第 59-79 行 & `app/routes/webhooks.tsx`

**问题描述**: Shopify 配置中注册了多个 webhook callbackUrl：
- `/webhooks/app/uninstalled`
- `/webhooks/shop/redact`
- `/webhooks/customers/data_request`
- `/webhooks/billing/update`
- `/webhooks/billing/decline`

但 Remix 中只有 `app/routes/webhooks.tsx`，对应路由 `/webhooks`。子路径如 `/webhooks/app/uninstalled` 在 Remix 文件路由中**没有对应路由文件**，会导致 404。Shopify 发送 webhook 到这些 URL 时会失败，导致卸载事件、GDPR 合规事件、订阅变更等**全部丢失**。

**修复建议**: 方案 A — 改用 Shopify SDK 的内置 webhook 处理（推荐）：
```typescript
// app/routes/webhooks.tsx — 使用 SDK 的标准方式
import { shopifyApp } from "@shopify/shopify-app-remix/server";
import { authenticate } from "~/shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin } = await authenticate.webhook(request);
  // 按 topic 处理...
};
```

方案 B — 将所有 webhook callbackUrl 统一改为 `/webhooks`。

---

### H-02: GraphQL 注入风险 — updateImageAltText

**文件**: `app/services/shopify.server.ts` 第 128-150 行

**问题描述**: `updateImageAltText` 和 `updateProductTags` 使用字符串拼接构建 GraphQL mutation，仅对双引号做了转义。但 alt text 可能包含反斜杠 `\`、换行符、Unicode 控制字符等，仍然可能破坏 GraphQL 语法或导致注入。

```typescript
// 仅转义了双引号，不够安全
alt: "${altText.replace(/"/g, '\\"')}"
```

**修复建议**: 使用 GraphQL 变量而非字符串拼接：
```typescript
export async function updateImageAltText(
  admin: any,
  imageId: string,
  altText: string
): Promise<boolean> {
  const response = await admin.graphql(
    `mutation UpdateMediaAlt($media: [MediaUpdateInput!]!) {
      productUpdateMedia(media: $media) {
        media { id alt }
        mediaUserErrors { field message }
      }
    }`,
    {
      variables: {
        media: [{ id: imageId, alt: altText }],
      },
    }
  );
  const data = await response.json();
  const errors = data.data?.productUpdateMedia?.mediaUserErrors;
  return !errors || errors.length === 0;
}
```

---

### H-03: GraphQL 注入风险 — fetchProducts 的 cursor 参数

**文件**: `app/services/shopify.server.ts` 第 43-45 行

**问题描述**: `cursor` 参数直接拼接到 GraphQL 查询字符串中。虽然 cursor 来自 Shopify API 返回（而非用户输入），但最佳实践仍应使用变量传参。

```typescript
const afterClause = cursor ? `, after: "${cursor}"` : "";
```

**修复建议**: 使用 GraphQL 变量传递 cursor。

---

### H-04: Settings 页面允许直接修改 planType 绕过 Shopify 计费

**文件**: `app/routes/app.settings.tsx` 第 68-75 行

**问题描述**: `update_plan` action 允许用户通过表单直接将 `planType` 改为任意值（包括 `business`），完全绕过 Shopify 的计费系统。用户可免费获得付费套餐权限。

```typescript
if (intent === "update_plan") {
  const newPlan = formData.get("plan") as string;
  if (PLANS[newPlan]) {
    await prisma.shop.update({
      where: { id: shop.id },
      data: { planType: newPlan },  // ❌ 直接改数据库，绕过计费
    });
  }
}
```

**修复建议**: 移除直接修改 plan 的功能。计划变更应通过 Shopify Billing API 创建 `appSubscription`，或在 Settings 页面引导用户到 Shopify 应用商店完成订阅：

```typescript
if (intent === "update_plan") {
  const newPlan = formData.get("plan") as string;
  if (newPlan === "free" || !PLANS[newPlan]) {
    return json({ success: false, error: "Invalid plan." });
  }
  // 使用 Shopify Billing 创建订阅
  const shopify = getShopify();
  const response = await shopify.billing.request({
    plan: newPlan,
    isTest: process.env.NODE_ENV !== "production",
    returnUrl: `/app/settings`,
    // ...
  });
  return json({ success: true, confirmationUrl: response.confirmationUrl });
}
```

---

### H-05: fetchImageAsBase64 缺少超时控制和错误处理

**文件**: `app/services/shopify.server.ts` 第 181-187 行

**问题描述**: `fetchImageAsBase64` 直接 `fetch(imageUrl)` 无超时设置。如果 Shopify CDN 响应慢或图片极大，会长时间阻塞 serverless 函数（Vercel 默认超时 10s），导致函数超时。此外，如果 `fetch` 返回非 200 状态（如 404），代码不会报错，而是将错误页面的 HTML 当作 base64 图片数据传给 OpenAI。

```typescript
export async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(imageUrl);  // ❌ 无超时、无状态检查
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return { base64, mimeType: contentType };
}
```

**修复建议**:
```typescript
export async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(imageUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Invalid content type: ${contentType}`);
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 20 * 1024 * 1024) { // 20MB limit
      throw new Error("Image too large (max 20MB)");
    }
    const base64 = Buffer.from(buffer).toString("base64");
    return { base64, mimeType: contentType };
  } finally {
    clearTimeout(timeout);
  }
}
```

---

### H-06: Generate 页面逐条处理图片 — 性能瓶颈与超时风险

**文件**: `app/routes/app.generate.tsx` 第 97-180 行

**问题描述**: `generate_alt` action 中使用 `for...of` 循环逐条处理图片：每张图都执行 fetch base64 → OpenAI API → 数据库写入 → 可能 Shopify 更新。10 张图片意味着至少 30 次串行网络请求。在 Vercel Serverless 的 10s 超时限制下，处理 3-5 张图就可能超时。

```typescript
for (const imageIdStr of imageIds) {
  const { base64, mimeType } = await fetchImageAsBase64(image.src);     // 网络请求 1
  const analysis = await analyzeImage(base64, mimeType, ...);           // 网络请求 2
  await prisma.productImage.update({ ... });                            // 数据库操作
  if (autoApply) {
    await updateImageAltText(admin, image.shopifyImageId, ...);         // 网络请求 3
  }
}
```

**修复建议**: 改为小批量并发处理（如 3 张一组）：
```typescript
const CONCURRENCY = 3;
const imageIdsArray = imageIds.map((id) => parseInt(id, 10));

for (let i = 0; i < imageIdsArray.length; i += CONCURRENCY) {
  const batch = imageIdsArray.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(async (imageId) => {
    // ... 处理单张图片
  }));
}
```

同样的问题存在于 `bulk_approve`（review.tsx 第 222 行）和 `sync`（sync.server.ts）操作中。

---

## 🟡 Medium 级别问题

### M-01: healthcheck 路由创建独立的 PrismaClient 实例

**文件**: `app/routes/healthcheck.tsx` 第 4 行

**问题描述**: healthcheck 路由 `import { PrismaClient } from "@prisma/client"` 并创建了一个独立的 PrismaClient 实例，绕过了 `db.server.ts` 中的全局单例模式。每次 health check 调用都会创建新连接，加剧连接池耗尽问题。

```typescript
const prisma = new PrismaClient();  // ❌ 每次调用都创建新实例
```

**修复建议**:
```typescript
import prisma from "~/db.server";
```

---

### M-02: 数据库缺少关键索引

**文件**: `prisma/schema.prisma`

**问题描述**: 以下查询场景缺少必要的索引：
1. `product_images` 表缺少 `product_id` 索引（频繁通过 productId 查询图片）
2. `product_images` 表缺少 `status` 索引（review 页面按 status 过滤）
3. `alt_text_history` 表缺少 `image_id` 索引
4. `backup_snapshots` 表缺少 `shop_id` 索引
5. `shops` 表缺少 `status` 索引（cleanup 任务按 status 查询过期店铺）

**修复建议**: 在 schema.prisma 中添加索引：
```prisma
model ProductImage {
  // ... 现有字段
  @@index([productId])
  @@index([status])
}

model AltTextHistory {
  // ... 现有字段
  @@index([imageId])
}

model BackupSnapshot {
  // ... 现有字段
  @@index([shopId])
}

model Shop {
  // ... 现有字段
  @@index([status])
}
```

---

### M-03: Backup 数据以 JSON 存储在 TEXT 字段中 — 无大小限制

**文件**: `prisma/schema.prisma` 第 67 行 & `app/services/backup.server.ts`

**问题描述**: `BackupSnapshot.data` 字段将整个店铺的所有产品和图片数据序列化为 JSON 存入单个 TEXT 字段。大店铺（数百产品×多张图片）可能生成数 MB 的 JSON，导致：
- 单次查询返回大量数据，影响性能
- 无备份数量限制，用户可无限创建备份

**修复建议**: 
1. 限制每个店铺的备份数量（如最多 10 个）
2. 对 `data` 字段考虑压缩存储
3. 添加备份大小上限检查

---

### M-04: `analyzeImage` 返回空 alt text 时不抛错

**文件**: `app/services/openai.server.ts` 第 120-124 行

**问题描述**: 当所有重试都失败后，`analyzeImage` 返回 `{ altText: "", analysis: {} }` 而非抛出错误。调用方（`app.generate.tsx`）将其视为成功结果写入数据库，导致数据库中存储了空 alt text 记录，浪费配额。

```typescript
// All retries exhausted
return {
  altText: "",  // ❌ 返回空字符串而非抛错
  analysis: { objects: [], colors: [], context: "", category: "" },
};
```

**修复建议**:
```typescript
throw new Error("Failed to generate alt text after " + MAX_RETRIES + " retries");
```

---

### M-05: Sync 同步操作 — N+1 查询问题

**文件**: `app/services/sync.server.ts` 第 10-40 行

**问题描述**: `syncProductsFromShopify` 对每个产品逐一调用 `upsertProduct`，后者又对每个图片逐一调用 `upsertProductImage`。对于一个 200 产品×5 张图片的店铺，这意味着 1200+ 次数据库操作。

**修复建议**: 使用批量操作减少数据库调用：
```typescript
// 使用 Prisma 的 createMany / upsert 批量操作
await prisma.product.createMany({
  data: productsToCreate,
  skipDuplicates: true,
});
```

---

### M-06: `generate_tags` action 未检查 quota

**文件**: `app/routes/app.generate.tsx` 第 91-95 行

**问题描述**: quota 检查只在 `generate_alt` 和 `generate_tags` 的入口做了 `enforceQuota`，但 `generate_jsonld`（第 238 行）没有任何 quota 检查，用户可以无限生成 JSON-LD。

**修复建议**: 在 `generate_jsonld` 分支前添加 quota 检查：
```typescript
if (intent === "generate_jsonld") {
  await enforceQuota(shop.id, "jsonld");
  // ...
}
```

---

### M-07: `cleanupExpiredShops` 函数未被任何地方调用

**文件**: `app/services/billing.server.ts` 第 237-254 行

**问题描述**: 已卸载店铺的数据保留 30 天后应被清理，但 `cleanupExpiredShops` 函数没有在任何定时任务、cron 或 API 端点中被调用。这意味着已卸载店铺的数据会**永远保留**在数据库中，持续消耗存储和数据库资源。

**修复建议**: 创建一个 cron 端点或使用 Vercel Cron Job 定期调用：
```typescript
// app/routes/cron.cleanup.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  // 验证请求来自 Vercel Cron（通过 header 验证）
  const count = await cleanupExpiredShops();
  return json({ cleaned: count });
}
```

配合 `vercel.json`:
```json
{
  "crons": [{
    "path": "/cron/cleanup",
    "schedule": "0 0 * * *"
  }]
}
```

---

## 🟢 Low 级别问题

### L-01: auth 路由每次请求都创建 Shop 记录

**文件**: `app/routes/auth.$.tsx` 第 8-20 行

**问题描述**: `auth.$.tsx` 的 loader 在每次认证请求时检查并创建 shop 记录，使用 `session.accessToken`（可能为空字符串）写入。如果 OAuth 流程尚未完成，可能写入无效数据。建议使用已有的 `getOrCreateShop` 方法（billing.server.ts）替代。

---

### L-02: app.products.tsx 中 `missingAltCount` 计算逻辑有误

**文件**: `app/routes/app.products.tsx` 第 62 行

**问题描述**: `missingAltCount` 基于 `images` 数组计算，但 loader 中 `images` 只 `take: 1`（取第一张图片）。因此 `missingAltCount` 最多为 0 或 1，不能反映真实的缺失数量。

```typescript
images: { take: 1 },  // 只取 1 张图片
// ...
missingAltCount: p.images.filter((img) => img.altTextOriginal === null).length,  // 不准确
```

**修复建议**: 单独查询图片统计或使用 `_count` 配合条件过滤。

---

### L-03: vercel.json 配置过于简单

**文件**: `vercel.json`

**问题描述**: 当前 `vercel.json` 仅指定了 `buildCommand`、`installCommand` 和 `framework`。缺少：
- 环境变量区域配置
- Cron job 定义
- 函数超时时间配置
- 安全 headers

**修复建议**:
```json
{
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install",
  "framework": "remix",
  "functions": {
    "app/**/*": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

---

### L-04: ErrorBoundary 组件中存在代码截断/拼接错误

**文件**: `app/routes/app.settings.tsx` 末尾部分

**问题描述**: 在审计过程中发现 `app.settings.tsx` 文件末尾存在异常的代码拼接，包含 `|| ad.intent === "bulk_approve"` 等本应属于 `app.review.tsx` 的代码片段。这可能是文件操作错误导致的，建议检查文件完整性。

---

### L-05: shopify.app.toml 中 client_id 和 dev_store_url 为空

**文件**: `shopify.app.toml` 第 4、8 行

**问题描述**: `client_id` 和 `dev_store_url` 均为空字符串。虽然在生产环境中这些可能由 Shopify CLI 自动注入，但空值可能导致本地开发或 CI/CD 流程失败。

---

## 📋 架构与优化建议

### 1. 连接池管理
Vercel Serverless + Neon PostgreSQL 场景下，建议：
- 在所有环境都启用 Prisma 单例缓存（修复 C-04）
- 考虑使用 Neon 的 serverless driver（`@neondatabase/serverless`）配合 Prisma 的 driver adapter
- 在 Prisma schema 中配置 `connection_limit`

### 2. 请求超时管理
- Generate 页面的批量操作应改为异步任务（如使用队列），而非在单次 serverless 函数调用中完成
- 考虑使用 Vercel Edge Functions 处理简单路由，Reserved Functions 处理耗时操作

### 3. 安全加固
- 所有 GraphQL 操作改用变量传参（修复 H-02, H-03）
- Webhook 处理使用 Shopify SDK 的内置验证（修复 C-03）
- 添加安全响应 headers（修复 L-03）

### 4. 数据一致性
- 批量操作使用数据库事务（`prisma.$transaction`）
- Review 页面的 approve/reject 操作应验证数据归属（修复 C-01, C-02）

### 5. 可观测性
- 添加结构化日志（当前使用 `console.log`，在生产中难以查询）
- 考虑添加 Sentry 等错误监控服务
- 为关键操作添加指标追踪

---

## 优先修复顺序建议

1. **立即修复**（会导致线上故障）：
   - C-04: Prisma 单例 — 连接池耗尽会导致全站崩溃
   - C-05: onboardingStep 字段 — Dashboard 页面不可用
   - H-01: Webhook 路由 — 卸载/GDPR 事件丢失

2. **尽快修复**（安全与数据隔离）：
   - C-01/C-02: Review 页面数据隔离
   - C-03: Webhook HMAC 验证
   - H-04: 绕过计费的 plan 修改

3. **计划修复**（性能与可靠性）：
   - H-05/H-06: 超时与性能问题
   - H-02/H-03: GraphQL 注入
   - M-02: 数据库索引
   - M-07: 过期数据清理

---

*本报告由代码审计工具生成，所有建议均基于静态代码分析。建议在应用修复前在测试环境充分验证。*
