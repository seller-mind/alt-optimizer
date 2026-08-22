import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

  if (!admin) {
    throw new Response();
  }

  switch (topic) {
    case "APP_UNINSTALLED":
      await handleAppUninstalled(shop);
      break;

    case "SHOP_REDACT":
      await handleShopRedact(shop);
      break;

    case "CUSTOMERS_DATA_REQUEST":
      await handleCustomersDataRequest(shop, payload);
      break;

    case "PRODUCTS_UPDATE":
    case "PRODUCTS_CREATE":
      // Could trigger re-sync here
      break;

    default:
      console.log(`[AltOptimizer] Unhandled webhook topic: ${topic}`);
  }

  return new Response();
};

async function handleAppUninstalled(shop: string): Promise<void> {
  console.log(`[AltOptimizer] App uninstalled for shop: ${shop}`);

  const shopRecord = await prisma.shop.findUnique({
    where: { shopDomain: shop },
  });

  if (shopRecord) {
    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: { status: "uninstalled" },
    });
  }
}

async function handleShopRedact(shop: string): Promise<void> {
  console.log(`[AltOptimizer] Shop data redact request for: ${shop}`);

  const shopRecord = await prisma.shop.findUnique({
    where: { shopDomain: shop },
  });

  if (shopRecord) {
    await prisma.product.deleteMany({ where: { shopId: shopRecord.id } });
    await prisma.backupSnapshot.deleteMany({ where: { shopId: shopRecord.id } });
    await prisma.usageMetric.deleteMany({ where: { shopId: shopRecord.id } });
    await prisma.shop.delete({ where: { id: shopRecord.id } });
  }
}

async function handleCustomersDataRequest(
  shop: string,
  payload: Record<string, unknown>
): Promise<void> {
  console.log(`[AltOptimizer] Customer data request for shop: ${shop}`);
  // AltOptimizer doesn't store customer data, so we just acknowledge
}
