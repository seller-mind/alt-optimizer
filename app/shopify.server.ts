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
  apiVersion: ApiVersion.July25,
  scopes: [
    "read_products",
    "write_products",
    "read_themes",
    "write_themes",
    "read_content",
    "write_content",
  ],
  appUrl: process.env.SHOPIFY_APP_URL || "https://localhost:3000",
  isEmbeddedApp: false,
  appDistribution: AppDistribution.MultiTenant,
  sessionStorage: new PrismaSessionStorage(prisma),
  hooks: {
    afterAuth: async ({ session }) => {
      const shop = session.shop;
      console.log(`[AltOptimizer] afterAuth for shop: ${shop}`);
      try {
        const existing = await prisma.shop.findUnique({
          where: { shopDomain: shop },
        });
        if (!existing) {
          await prisma.shop.create({
            data: {
              shopDomain: shop,
              accessToken: session.accessToken || "",
              planType: "free",
              status: "active",
            },
          });
        } else {
          await prisma.shop.update({
            where: { shopDomain: shop },
            data: {
              status: "active",
              accessToken: session.accessToken || existing.accessToken,
            },
          });
        }
      } catch (error) {
        console.error("[AltOptimizer] afterAuth shop record error:", error);
      }
    },
  },
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks",
    },
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
