import prisma from "~/db.server";
import { PLANS, type PlanConfig } from "~/constants";

export type { PlanConfig };
export { PLANS };

export async function getCurrentUsage(shopId: number): Promise<{
  imagesGenerated: number;
  apiCalls: number;
  quota: number;
  percentage: number;
  planName: string;
}> {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new Error("Shop not found");

  const plan = PLANS[shop.planType] || PLANS.free;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateStr = monthStart.toISOString().split("T")[0];

  const metric = await prisma.usageMetric.findUnique({
    where: { shopId_date: { shopId, date: dateStr } },
  });

  const imagesGenerated = metric?.imagesGenerated || 0;
  const apiCalls = metric?.apiCalls || 0;

  return {
    imagesGenerated,
    apiCalls,
    quota: plan.monthlyQuota,
    percentage: Math.round((imagesGenerated / plan.monthlyQuota) * 100),
    planName: plan.name,
  };
}

export async function incrementUsage(
  shopId: number,
  imagesCount: number = 1
): Promise<void> {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  await prisma.usageMetric.upsert({
    where: { shopId_date: { shopId, date: dateStr } },
    update: {
      imagesGenerated: { increment: imagesCount },
      apiCalls: { increment: 1 },
    },
    create: {
      shopId,
      date: dateStr,
      imagesGenerated: imagesCount,
      apiCalls: 1,
    },
  });
}

export async function checkQuota(shopId: number): Promise<{
  canGenerate: boolean;
  remaining: number;
  warning: boolean;
}> {
  const usage = await getCurrentUsage(shopId);
  const remaining = usage.quota - usage.imagesGenerated;

  return {
    canGenerate: remaining > 0,
    remaining,
    warning: usage.percentage >= 80,
  };
}

export async function getShopPlan(shopId: number): Promise<string> {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  return shop?.planType || "free";
}

export async function updateShopPlan(shopId: number, planType: string): Promise<void> {
  await prisma.shop.update({
    where: { id: shopId },
    data: { planType },
  });
}

export async function getUsageHistory(shopId: number, days: number = 30): Promise<
  Array<{ date: string; imagesGenerated: number; apiCalls: number }>
> {
  const metrics = await prisma.usageMetric.findMany({
    where: { shopId },
    orderBy: { date: "desc" },
    take: days,
  });

  return metrics.map((m) => ({
    date: m.date,
    imagesGenerated: m.imagesGenerated,
    apiCalls: m.apiCalls,
  }));
}
