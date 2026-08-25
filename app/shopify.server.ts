import "@shopify/shopify-app-remix/adapters/node";
import { ApiVersion, AppDistribution, shopifyApp } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

function getShopifyConfig() {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecretKey = process.env.SHOPIFY_API_SECRET;
  const appUrl = process.env.SHOPIFY_APP_URL || process.env.HOST || "https://localhost:5000";

  return {
    apiKey: apiKey || "",
    apiSecretKey: apiSecretKey || "",
    scopes: [
      "read_products",
      "write_products",
      "read_themes",
      "write_themes",
      "read_content",
      "write_content",
    ],
    apiVersion: ApiVersion.October24,
    isEmbeddedApp: true,
    appDistribution: AppDistribution.MultiTenant,
    appUrl,
    sessionStorage: new PrismaSessionStorage(prisma),
    billing: {
      Free: {
        amount: 0,
        currencyCode: "USD",
        interval: "EVER_30_DAYS" as const,
        usageTerms: "50 image generations per month",
      },
      Starter: {
        amount: 9,
        currencyCode: "USD",
        interval: "EVER_30_DAYS" as const,
        usageTerms: "300 image generations per month",
      },
      Professional: {
        amount: 19,
        currencyCode: "USD",
        interval: "EVER_30_DAYS" as const,
        usageTerms: "1000 image generations per month",
      },
      Business: {
        amount: 49,
        currencyCode: "USD",
        interval: "EVER_30_DAYS" as const,
        usageTerms: "5000 image generations per month",
      },
    },
    hooks: {
      afterAuth: async ({ session }: { session: { shop: string; accessToken?: string } }) => {
        const shop = session.shop;
        console.log(`[AltOptimizer] App installed for shop: ${shop}`);
        
        try {
          const existingShop = await prisma.shop.findUnique({
            where: { shopDomain: shop },
          });
          
          if (!existingShop) {
            await prisma.shop.create({
              data: {
                shopDomain: shop,
                accessToken: session.accessToken || "",
                planType: "free",
                status: "active",
              },
            });
            console.log(`[AltOptimizer] Created shop record for: ${shop}`);
          } else {
            await prisma.shop.update({
              where: { shopDomain: shop },
              data: {
                status: "active",
                accessToken: session.accessToken || existingShop.accessToken,
              },
            });
            console.log(`[AltOptimizer] Updated shop record for: ${shop}`);
          }
        } catch (error) {
          console.error(`[AltOptimizer] Failed to create/update shop record:`, error);
        }
      },
    },
    webhooks: {
      APP_UNINSTALLED: {
        deliveryMethod: "http" as const,
        callbackUrl: "/webhooks",
      },
      SHOP_REDACT: {
        deliveryMethod: "http" as const,
        callbackUrl: "/webhooks",
      },
      CUSTOMERS_DATA_REQUEST: {
        deliveryMethod: "http" as const,
        callbackUrl: "/webhooks",
      },
      APP_SUBSCRIPTIONS_UPDATE: {
        deliveryMethod: "http" as const,
        callbackUrl: "/webhooks",
      },
      APP_SUBSCRIPTIONS_DECLINE: {
        deliveryMethod: "http" as const,
        callbackUrl: "/webhooks",
      },
    },
    // REMOVED: unstable_newEmbeddedAuthStrategy - was causing blank page in iframe
    // The default cookie-based auth is stable and proven to work in embedded apps
  };
}

let _shopify: ReturnType<typeof shopifyApp> | null = null;

function getShopify(): ReturnType<typeof shopifyApp> {
  if (!_shopify) {
    const config = getShopifyConfig();
    if (!config.apiKey || !config.apiSecretKey) {
      throw new Error(
        "Shopify app not configured. Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET environment variables."
      );
    }
    _shopify = shopifyApp(config);
  }
  return _shopify;
}

function getShopifySafe(): ReturnType<typeof shopifyApp> | null {
  try {
    return getShopify();
  } catch {
    return null;
  }
}

const authenticate = {
  admin: (request: Request) => {
    const shopify = getShopify();
    return shopify.authenticate.admin(request);
  },
  webhook: (request: Request) => {
    const shopify = getShopify();
    return shopify.authenticate.webhook(request);
  },
  public: (request: Request) => {
    const shopify = getShopify();
    return shopify.authenticate.public(request);
  },
};

export { getShopify, getShopifySafe, authenticate };
export default getShopify;
