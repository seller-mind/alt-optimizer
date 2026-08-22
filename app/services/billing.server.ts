import prisma from "~/db.server";
import { PLANS, type PlanConfig } from "~/constants";

export type { PlanConfig };
export { PLANS };

export class QuotaExceededError extends Error {
  constructor(
    public planName: string,
    public quota: number,
    public usage: number,
    public type: "images" | "tags" | "jsonld"
  ) {
    super(`Quota exceeded for ${type}: ${usage}/${quota} used on ${planName} plan`);
    this.name = "QuotaExceededError";
  }
}

export function getPlanByType(planType: string): PlanConfig {
  return PLANS[planType] || PLANS.free;
}

export async function getOrCreateShop(
  shopDomain: string,
  accessToken: string
): Promise<{ id: number; planType: string }> {
  const shop = await prisma.shop.upsert({
    where: { shopDomain },
    update: {
      accessToken,
      status: "active",
      uninstallDate: null,
      dataRetentionUntil: null,
    },
    create: {
      shopDomain,
      accessToken,
      planType: "free",
      status: "active",
    },
  });
  return { id: shop.id, planType: shop.planType };
}

export async function getCurrentUsage(shopId: number): Promise<{
  imagesGenerated: number;
  tagsGenerated: number;
  jsonLdGenerated: number;
  apiCalls: number;
  quota: number;
  percentage: number;
  planName: string;
  planType: string;
  remaining: number;
}> {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new Error("Shop not found");

  const plan = getPlanByType(shop.planType);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateStr = monthStart.toISOString().split("T")[0];

  const metric = await prisma.usageMetric.findUnique({
    where: { shopId_date: { shopId, date: dateStr } },
  });

  const imagesGenerated = metric?.imagesGenerated || 0;
  const tagsGenerated = metric?.tagsGenerated || 0;
  const jsonLdGenerated = metric?.jsonLdGenerated || 0;
  const apiCalls = metric?.apiCalls || 0;
  const totalUsage = imagesGenerated + tagsGenerated + jsonLdGenerated;

  return {
    imagesGenerated,
    tagsGenerated,
    jsonLdGenerated,
    apiCalls,
    quota: plan.monthlyQuota,
    percentage: Math.min(100, Math.round((totalUsage / plan.monthlyQuota) * 100)),
    planName: plan.name,
    planType: shop.planType,
    remaining: Math.max(0, plan.monthlyQuota - totalUsage),
  };
}

export async function checkQuota(
  shopId: number,
  type: "images" | "tags" | "jsonld" = "images"
): Promise<{
  canGenerate: boolean;
  remaining: number;
  quota: number;
  planName: string;
  planType: string;
  warning: boolean;
  warning95: boolean;
}> {
  const usage = await getCurrentUsage(shopId);
  const plan = getPlanByType(usage.planType);
  const totalUsage = usage.imagesGenerated + usage.tagsGenerated + usage.jsonLdGenerated;

  return {
    canGenerate: usage.remaining > 0,
    remaining: usage.remaining,
    quota: plan.monthlyQuota,
    planName: plan.name,
    planType: usage.planType,
    warning: usage.percentage >= 80,
    warning95: usage.percentage >= 95,
  };
}

export async function enforceQuota(
  shopId: number,
  type: "images" | "tags" | "jsonld" = "images"
): Promise<void> {
  const usage = await getCurrentUsage(shopId);
  const plan = getPlanByType(usage.planType);

  if (usage.remaining <= 0) {
    throw new QuotaExceededError(
      plan.name,
      plan.monthlyQuota,
      usage.imagesGenerated + usage.tagsGenerated + usage.jsonLdGenerated,
      type
    );
  }
}

export async function incrementUsage(
  shopId: number,
  type: "images" | "tags" | "jsonld" = "images",
  count: number = 1
): Promise<void> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateStr = monthStart.toISOString().split("T")[0];

  const incrementField =
    type === "images" ? { imagesGenerated: { increment: count } }
    : type === "tags" ? { tagsGenerated: { increment: count } }
    : { jsonLdGenerated: { increment: count } };

  await prisma.usageMetric.upsert({
    where: { shopId_date: { shopId, date: dateStr } },
    update: {
      ...incrementField,
      apiCalls: { increment: 1 },
    },
    create: {
      shopId,
      date: dateStr,
      imagesGenerated: type === "images" ? count : 0,
      tagsGenerated: type === "tags" ? count : 0,
      jsonLdGenerated: type === "jsonld" ? count : 0,
      apiCalls: 1,
    },
  });
}

export async function resetMonthlyQuota(shopId: number): Promise<void> {
  const now = new Date();
  await prisma.shop.update({
    where: { id: shopId },
    data: { lastQuotaResetAt: now },
  });
}

export async function getShopPlan(shopId: number): Promise<{
  planType: string;
  planName: string;
  chargeId: string | null;
}> {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new Error("Shop not found");
  const plan = getPlanByType(shop.planType);
  return {
    planType: shop.planType,
    planName: plan.name,
    chargeId: shop.chargeId,
  };
}

export async function updateShopPlan(
  shopId: number,
  planType: string,
  chargeId?: string
): Promise<void> {
  const data: Record<string, string> = { planType };
  if (chargeId) data.chargeId = chargeId;
  await prisma.shop.update({
    where: { id: shopId },
    data,
  });
}

export async function getUsageHistory(
  shopId: number,
  days: number = 30
): Promise<
  Array<{
    date: string;
    imagesGenerated: number;
    tagsGenerated: number;
    jsonLdGenerated: number;
    apiCalls: number;
  }>
> {
  const metrics = await prisma.usageMetric.findMany({
    where: { shopId },
    orderBy: { date: "desc" },
    take: days,
  });

  return metrics.map((m) => ({
    date: m.date,
    imagesGenerated: m.imagesGenerated,
    tagsGenerated: m.tagsGenerated,
    jsonLdGenerated: m.jsonLdGenerated,
    apiCalls: m.apiCalls,
  }));
}

export async function deleteShopData(shopId: number): Promise<void> {
  await prisma.$transaction([
    prisma.altTextHistory.deleteMany({
      where: { image: { product: { shopId } } },
    }),
    prisma.productImage.deleteMany({
      where: { product: { shopId } },
    }),
    prisma.product.deleteMany({ where: { shopId } }),
    prisma.backupSnapshot.deleteMany({ where: { shopId } }),
    prisma.usageMetric.deleteMany({ where: { shopId } }),
    prisma.shop.delete({ where: { id: shopId } }),
  ]);
}

export async function cleanupExpiredShops(): Promise<number> {
  const now = new Date();
  const expiredShops = await prisma.shop.findMany({
    where: {
      status: "uninstalled",
      dataRetentionUntil: { lte: now },
    },
  });

  for (const shop of expiredShops) {
    console.log(`[Cleanup] Deleting data for shop ${shop.shopDomain} (ID: ${shop.id})`);
    await deleteShopData(shop.id);
  }

  return expiredShops.length;
}