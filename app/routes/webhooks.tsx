import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createHmac, timingSafeEqual } from "crypto";
import prisma from "~/db.server";
import { deleteShopData } from "~/services/billing.server";

/**
 * Generic webhook handler that verifies HMAC and processes Shopify webhooks.
 * Returns 200 for all known events, 401 for invalid HMAC, 404 for unknown topics.
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const topic = request.headers.get("x-shopify-topic") || "unknown";
    const shopDomain = request.headers.get("x-shopify-shop-domain") || "";
    const hmac = request.headers.get("x-shopify-hmac-sha256") || "";

    const body = await request.text();

    // Verify HMAC signature for security
    if (!hmac) {
      console.warn(`[Webhook] Missing HMAC for topic: ${topic}`);
      return json({ error: "Missing HMAC" }, { status: 401 });
    }

    const secret = process.env.SHOPIFY_API_SECRET;
    if (!secret) {
      console.error("[Webhook] SHOPIFY_API_SECRET not configured");
      return json({ error: "Server configuration error" }, { status: 500 });
    }

    const hash = createHmac("sha256", secret).update(body, "utf8").digest("base64");
    const hmacBuffer = Buffer.from(hmac, "base64");
    const hashBuffer = Buffer.from(hash, "base64");

    if (
      hmacBuffer.length !== hashBuffer.length ||
      !timingSafeEqual(hmacBuffer, hashBuffer)
    ) {
      console.warn(`[Webhook] Invalid HMAC for topic: ${topic}`);
      return json({ error: "Invalid HMAC" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch {
      payload = { raw: body };
    }

    console.log(`[Webhook] Received: topic=${topic}, shop=${shopDomain}`);

    switch (topic) {
      case "app/uninstalled":
      case "APP_UNINSTALLED": {
        await handleAppUninstalled(shopDomain);
        break;
      }
      case "shop/redact":
      case "SHOP_REDACT": {
        await handleShopRedact(shopDomain, payload);
        break;
      }
      case "customers/data_request":
      case "CUSTOMERS_DATA_REQUEST": {
        await handleCustomersDataRequest(shopDomain, payload);
        break;
      }
      case "app_subscriptions/update":
      case "APP_SUBSCRIPTIONS_UPDATE": {
        await handleSubscriptionUpdate(payload);
        break;
      }
      case "app_subscriptions/decline":
      case "APP_SUBSCRIPTIONS_DECLINE": {
        await handleSubscriptionDecline(shopDomain);
        break;
      }
      default: {
        console.log(`[Webhook] Unknown topic: ${topic}`);
        return json({ message: "Unknown topic" }, { status: 404 });
      }
    }

    return json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error(`[Webhook] Error processing webhook:`, error);
    // Always return 200 to prevent Shopify from retrying
    return json({ ok: true, error: "Internal error" }, { status: 200 });
  }
}

/**
 * APP_UNINSTALLED: Mark shop as inactive, set 30-day retention period.
 * Data is kept for 30 days grace period, then cleaned up.
 */
async function handleAppUninstalled(shopDomain: string): Promise<void> {
  const now = new Date();
  const retentionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop) {
    console.warn(`[Webhook] Shop not found for uninstall: ${shopDomain}`);
    return;
  }

  await prisma.shop.update({
    where: { shopDomain },
    data: {
      status: "uninstalled",
      accessToken: "",
      uninstallDate: now,
      dataRetentionUntil: retentionDate,
    },
  });

  // Delete all sessions for this shop
  await prisma.session.deleteMany({
    where: { shop: shopDomain },
  });

  console.log(
    `[Webhook] Shop ${shopDomain} uninstalled. Data retained until ${retentionDate.toISOString()}`
  );
}

/**
 * SHOP_REDACT: GDPR data deletion request - immediately delete ALL data.
 * Shopify requires merchants to be able to delete all data.
 */
async function handleShopRedact(shopDomain: string, payload: any): Promise<void> {
  const shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop) {
    console.warn(`[Webhook] Shop not found for redact: ${shopDomain}`);
    return;
  }

  console.log(`[Webhook] Redacting all data for shop ${shopDomain} (ID: ${shop.id})`);
  await deleteShopData(shop.id);
  console.log(`[Webhook] Data redacted for shop ${shopDomain}`);
}

/**
 * CUSTOMERS_DATA_REQUEST: We don't collect customer data, so respond with empty.
 * Log the request for audit trail.
 */
async function handleCustomersDataRequest(shopDomain: string, payload: any): Promise<void> {
  console.log(
    `[Webhook] Customer data request for shop ${shopDomain}:`,
    JSON.stringify({ shopDomain, customerId: payload.customer_id || "unknown" })
  );
  // We don't store any customer data, so nothing to return
}

/**
 * APP_SUBSCRIPTIONS_UPDATE: Handle subscription changes.
 * Map the plan name to our plan type and update the shop.
 */
async function handleSubscriptionUpdate(payload: any): Promise<void> {
  const shopDomain = payload.shop_domain || payload.shop?.domain || "";
  const planName = payload.app_subscription?.name || "";
  const status = payload.app_subscription?.status || "";
  const chargeId = payload.app_subscription?.id?.toString() || "";

  if (!shopDomain) {
    console.warn(`[Webhook] Subscription update missing shop domain`);
    return;
  }

  const shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop) {
    console.warn(`[Webhook] Shop not found for subscription update: ${shopDomain}`);
    return;
  }

  // Map plan name from Shopify billing to our plan type
  const planMap: Record<string, string> = {
    "Free": "free",
    "Starter": "starter",
    "Professional": "professional",
    "Business": "business",
  };

  const planType = planMap[planName] || "free";

  if (status === "ACTIVE" || status === "active") {
    await prisma.shop.update({
      where: { shopDomain },
      data: { planType, chargeId },
    });
    console.log(
      `[Webhook] Subscription updated for ${shopDomain}: ${planName} (${planType}), charge: ${chargeId}`
    );
  } else if (status === "CANCELLED" || status === "cancelled" || status === "FROZEN") {
    await prisma.shop.update({
      where: { shopDomain },
      data: { planType: "free", chargeId: null },
    });
    console.log(
      `[Webhook] Subscription cancelled/frozen for ${shopDomain}, reverting to Free`
    );
  }
}

/**
 * APP_SUBSCRIPTIONS_DECLINE: Handle subscription declines.
 * Revert to Free plan.
 */
async function handleSubscriptionDecline(shopDomain: string): Promise<void> {
  if (!shopDomain) return;

  await prisma.shop.update({
    where: { shopDomain },
    data: { planType: "free", chargeId: null },
  });

  console.log(`[Webhook] Subscription declined for ${shopDomain}, reverted to Free`);
}

/**
 * GET requests are not supported for webhooks.
 */
export async function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}