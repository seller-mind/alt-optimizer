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
  appDistribution: AppDistribution.MultiTenant,
  sessionStorage: new PrismaSessionStorage(prisma),
  hooks: {
    afterAuth: async ({ session }) => {
      const shop = session.shop;
      console.log(`[AltOptimizer] afterAuth for shop: ${shop}, token expires: ${session.expires || "never"}`);

      // Migrate non-expiring token to expiring token (required for public apps created after April 2026)
      let tokenToStore = session.accessToken || "";
      if (session.accessToken && !session.expires) {
        try {
          console.log(`[AltOptimizer] Migrating non-expiring token to expiring for ${shop}...`);
          const migrateResp = await fetch(
            `https://${shop}/admin/oauth/access_token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: process.env.SHOPIFY_API_KEY || "",
                client_secret: process.env.SHOPIFY_API_SECRET || "",
                grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
                subject_token: session.accessToken,
                subject_token_type: "urn:shopify:params:oauth:token-type:offline-access-token",
                requested_token_type: "urn:shopify:params:oauth:token-type:offline-access-token",
                expiring: "1",
              }),
            }
          );
          const migrateData = await migrateResp.json();
          if (migrateData.access_token) {
            tokenToStore = migrateData.access_token;
            console.log(`[AltOptimizer] Token migrated successfully. Expires in: ${migrateData.expires_in}s, has refresh_token: ${!!migrateData.refresh_token}`);
            // Update session object so SDK also uses the new token
            session.accessToken = migrateData.access_token;
            if (migrateData.expires_in) {
              session.expires = Math.floor(Date.now() / 1000) + migrateData.expires_in;
            }
          } else {
            console.error(`[AltOptimizer] Token migration failed:`, JSON.stringify(migrateData));
          }
        } catch (migrateErr) {
          console.error(`[AltOptimizer] Token migration error:`, migrateErr);
        }
      }

      try {
        const existing = await prisma.shop.findUnique({
          where: { shopDomain: shop },
        });
        if (!existing) {
          await prisma.shop.create({
            data: {
              shopDomain: shop,
              accessToken: tokenToStore,
              planType: "free",
              status: "active",
            },
          });
        } else {
          await prisma.shop.update({
            where: { shopDomain: shop },
            data: {
              status: "active",
              accessToken: tokenToStore || existing.accessToken,
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
