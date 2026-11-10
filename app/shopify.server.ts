import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  DeliveryMethod,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import {
  BILLING_PLANS as PLAN_DEFINITIONS,
  BILLING_PLAN_KEYS,
  type BillingPlanKey,
} from "./billing-plans";

/**
 * Recurring subscription line item.
 *
 * `interval` must be narrowed to the two recurring values Shopify accepts.
 * Declaring it as the full BillingInterval enum makes the whole config fail to
 * typecheck against BillingConfigSubscriptionLineItemPlan.
 */
type RecurringLineItem = {
  amount: number;
  currencyCode: string;
  interval: BillingInterval.Every30Days | BillingInterval.Annual;
};

type RecurringPlan = {
  lineItems: RecurringLineItem[];
};

/**
 * Paid subscription plans.
 *
 * The keys are the plan identifiers Shopify uses in three places, and all three
 * must stay identical or billing silently fails:
 *
 *   1. `billing.request({ plan })` in app/routes/app.settings.tsx
 *   2. `app_subscription.name` in the APP_SUBSCRIPTIONS_UPDATE webhook payload
 *   3. `planMap` in app/routes/webhooks.tsx
 *
 * Amounts must match `price` in app/constants.ts:
 *   Starter $9 / Professional $19 / Business $49
 *
 * Free is intentionally absent — it is the default plan on every shop and
 * requires no charge.
 */
export const BILLING_PLANS: Record<BillingPlanKey, RecurringPlan> =
  PLAN_DEFINITIONS as unknown as Record<BillingPlanKey, RecurringPlan>;

export { BILLING_PLAN_KEYS };
export type { BillingPlanKey };

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  apiVersion: ApiVersion.July26,
  scopes: [
    "read_themes",
    "write_themes",
    "read_products",
    "write_products",
  ],
  appUrl: process.env.SHOPIFY_APP_URL || "https://localhost:3000",
  isEmbeddedApp: true,
  appDistribution: AppDistribution.AppStore,
  sessionStorage: new PrismaSessionStorage(prisma),
  billing: BILLING_PLANS,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    expiringOfflineAccessTokens: true,
  },
  hooks: {
    afterAuth: async ({ session }) => {
      const shop = session.shop;
      console.log(
        `[AltOptimizer] afterAuth for shop: ${shop}, online: ${session.isOnline}`
      );

      try {
        await prisma.shop.upsert({
          where: { shopDomain: shop },
          update: { accessToken: session.accessToken || "" },
          create: {
            shopDomain: shop,
            accessToken: session.accessToken || "",
            planType: "free",
          },
        });
        console.log(`[AltOptimizer] Shop record upserted: ${shop}`);
      } catch (error: any) {
        console.error(
          `[AltOptimizer] afterAuth shop record error:`,
          error.message
        );
      }
    },
  },
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    // Without this entry Shopify never delivers subscription changes, so the
    // handler in app/routes/webhooks.tsx would never fire and planType would
    // stay "free" forever.
    APP_SUBSCRIPTIONS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    SHOP_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
