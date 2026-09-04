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
      const sessionId = `offline_${shop}`;
      console.log(`[AltOptimizer] afterAuth for shop: ${shop}, token expires: ${session.expires ? new Date(session.expires as any).toISOString() : "never"}`);

      // Migrate non-expiring token to expiring token (required for Admin API since 2026)
      if (session.accessToken && !session.expires) {
        try {
          console.log(`[AltOptimizer] Migrating non-expiring token to expiring for ${shop}...`);
          const migrateResp = await fetch(
            `https://${shop}/admin/oauth/access_token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                client_id: process.env.SHOPIFY_API_KEY,
                client_secret: process.env.SHOPIFY_API_SECRET,
                grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
                subject_token: session.accessToken,
                subject_token_type: "urn:shopify:params:oauth:token-type:offline-access-token",
                requested_token_type: "urn:shopify:params:oauth:token-type:offline-access-token",
                expiring: 1,
              }),
            }
          );

          if (migrateResp.ok) {
            const migrateData = await migrateResp.json();
            if (migrateData.access_token) {
              const expiresIn = migrateData.expires_in; // e.g. 3600
              const expiresAt = new Date(Date.now() + expiresIn * 1000);
              const newToken = migrateData.access_token;
              const refreshToken = migrateData.refresh_token || null;

              // CRITICAL: The SDK saves the session AFTER afterAuth returns,
              // which would overwrite our DB changes with the old non-expiring token.
              // Use setTimeout to ensure our DB update runs AFTER the SDK's save.
              console.log(`[AltOptimizer] Scheduling deferred DB update for session ${sessionId}`);
              setTimeout(async () => {
                try {
                  // Overwrite the session record with the migrated expiring token
                  await prisma.session.update({
                    where: { id: sessionId },
                    data: {
                      accessToken: newToken,
                      expires: expiresAt,
                    },
                  });
                  console.log(`[AltOptimizer] Deferred session update done. Token now expires at ${expiresAt.toISOString()}`);

                  // Verify by re-reading
                  const verify = await prisma.session.findUnique({ where: { id: sessionId } });
                  console.log(`[AltOptimizer] Verified session: expires=${verify?.expires?.toISOString()}, token=${verify?.accessToken?.substring(0, 15)}...`);
                } catch (e: any) {
                  console.error(`[AltOptimizer] Deferred session update failed:`, e.message);
                }
              }, 3000);

              // Update shops table (immediate — separate table, no conflict)
              await prisma.shop.upsert({
                where: { shopDomain: shop },
                update: { accessToken: newToken, status: "active" },
                create: { shopDomain: shop, accessToken: newToken, planType: "free", status: "active" },
              });

              // Store refresh token if column exists
              if (refreshToken) {
                try {
                  await prisma.$executeRawUnsafe(
                    `UPDATE shops SET refresh_token = $1 WHERE shop_domain = $2`,
                    refreshToken, shop
                  );
                } catch (_) { /* column may not exist yet */ }
              }

              console.log(`[AltOptimizer] Token migrated: expires in ${expiresIn}s, refresh_token: ${!!refreshToken}`);
              return;
            } else {
              console.error(`[AltOptimizer] Token migration failed:`, JSON.stringify(migrateData));
            }
          } else {
            const errBody = await migrateResp.text();
            console.error(`[AltOptimizer] Token migration HTTP error: ${migrateResp.status} ${errBody.slice(0, 300)}`);
          }
        } catch (migrateErr: any) {
          console.error(`[AltOptimizer] Token migration error:`, migrateErr.message);
        }
      }

      // Normal shop record update (token already expiring, or migration failed)
      try {
        await prisma.shop.upsert({
          where: { shopDomain: shop },
          update: { status: "active", accessToken: session.accessToken || undefined },
          create: { shopDomain: shop, accessToken: session.accessToken || "", planType: "free", status: "active" },
        });
      } catch (error: any) {
        console.error("[AltOptimizer] afterAuth shop record error:", error.message);
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
