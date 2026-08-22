import "@shopify/shopify-app-remix/adapters/node";
import { ApiVersion, AppDistribution, shopifyApp } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
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
  appDistribution: AppDistribution.AppStore,
  appUrl: process.env.HOST || "https://localhost:5000",
  sessionStorage: new PrismaSessionStorage(prisma),
  billing: {
    Free: {
      amount: 0,
      currencyCode: "USD",
      interval: "EVER_30_DAYS",
      usageTerms: "50 image generations per month",
    },
    Starter: {
      amount: 9,
      currencyCode: "USD",
      interval: "EVER_30_DAYS",
      usageTerms: "300 image generations per month",
    },
    Professional: {
      amount: 19,
      currencyCode: "USD",
      interval: "EVER_30_DAYS",
      usageTerms: "1000 image generations per month",
    },
    Business: {
      amount: 49,
      currencyCode: "USD",
      interval: "EVER_30_DAYS",
      usageTerms: "5000 image generations per month",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      const shop = session.shop;
      console.log(`[AltOptimizer] App installed for shop: ${shop}`);
    },
  },
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks/app/uninstalled",
    },
    SHOP_REDACT: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks/shop/redact",
    },
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks/customers/data_request",
    },
  },
});

export default shopify;
export const { authenticate, registerWebhooks, sessionStorage, addDocumentResponseHeaders } = shopify;
export const apiVersion = ApiVersion.October24;
