import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

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
          update: {},
          create: {
            shopDomain: shop,
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
      deliveryMethod: "http",
      callbackUrl: "/webhooks",
    },
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks",
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks",
    },
    SHOP_REDACT: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks",
    },
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
