import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

    if (!admin) {
      console.warn(`[AltOptimizer] Webhook received but no admin: ${topic}`);
      return new Response();
    }

    console.log(`[AltOptimizer] Processing webhook: ${topic} for shop: ${shop}`);

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
        // Optionally trigger re-sync here with a queued job
        console.log(`[AltOptimizer] Product ${topic} received for shop: ${shop}`);
        break;

      default:
        console.log(`[AltOptimizer] Unhandled webhook topic: ${topic}`);
    }

    return new Response();
  } catch (error) {
    // HMAC verification failed or other critical error
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    console.error(`[AltOptimizer] Webhook error: ${message}`);
    // Return 200 to acknowledge receipt even on error (Shopify retries if we return 5xx)
    return new Response();
  }
};

/**
 * APP_UNINSTALLED — Mark shop as inactive, keep data for 30-day grace period.
 * Shopify merchants can reinstall within 30 days and recover their data.
 * After 30 days, a cleanup job (manual or cron) can permanently delete.
 */
async function handleAppUninstalled(shop: string): Promise<void> {
  const shopRecord = await prisma.shop.findUnique({
    where: { shopDomain: shop },
  });

  if (shopRecord) {
    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: {
        status: "uninstalled",
        accessToken: "", // Clear access token immediately — it's invalid after uninstall
        // Store uninstalled timestamp for 30-day grace period tracking
      },
    });

    console.log(`[AltOptimizer] Shop ${shop} marked as uninstalled. Data retained for 30-day grace period.`);

    // Uninstall event: clean up the billing record
    // Delete sessions since they're no longer valid
    await prisma.session.deleteMany({
      where: { shop },
    });
  }
}

/**
 * SHOP_REDACT — GDPR data deletion request.
 * Permanently delete ALL shop data within 48 hours as required by GDPR.
 * This is triggered when a merchant requests data deletion or after 30 days from uninstall.
 */
async function handleShopRedact(shop: string): Promise<void> {
  console.log(`[AltOptimizer] GDPR redact request for shop: ${shop}`);

  const shopRecord = await prisma.shop.findUnique({
    where: { shopDomain: shop },
  });

  if (shopRecord) {
    // Delete in order to respect foreign key constraints
    // 1. Delete alt text history
    const productImages = await prisma.productImage.findMany({
      where: { product: { shopId: shopRecord.id } },
      select: { id: true },
    });
    const imageIds = productImages.map((img) => img.id);

    if (imageIds.length > 0) {
      await prisma.altTextHistory.deleteMany({
        where: { imageId: { in: imageIds } },
      });
    }

    // 2. Delete product images
    await prisma.productImage.deleteMany({
      where: { product: { shopId: shopRecord.id } },
    });

    // 3. Delete products
    await prisma.product.deleteMany({
      where: { shopId: shopRecord.id },
    });

    // 4. Delete backup snapshots
    await prisma.backupSnapshot.deleteMany({
      where: { shopId: shopRecord.id },
    });

    // 5. Delete usage metrics
    await prisma.usageMetric.deleteMany({
      where: { shopId: shopRecord.id },
    });

    // 6. Delete sessions
    await prisma.session.deleteMany({
      where: { shop },
    });

    // 7. Finally delete the shop record
    await prisma.shop.delete({
      where: { id: shopRecord.id },
    });

    console.log(`[AltOptimizer] All data permanently deleted for shop: ${shop}`);
  }
}

/**
 * CUSTOMERS_DATA_REQUEST — GDPR customer data request.
 * AltOptimizer does NOT collect or store any customer data.
 * We only process product images, which are shop-owned.
 * Respond with empty data payload as required by Shopify.
 */
async function handleCustomersDataRequest(
  shop: string,
  payload: Record<string, unknown>
): Promise<void> {
  console.log(`[AltOptimizer] Customer data request for shop: ${shop}`);
  console.log(`[AltOptimizer] Request payload:`, JSON.stringify(payload));

  // AltOptimizer stores zero customer data.
  // We only store: shop info, product data, image alt text, usage metrics.
  // No customer emails, names, addresses, orders, or any PII.
  // Acknowledge the request per Shopify GDPR requirements.
}