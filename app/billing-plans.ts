/**
 * Billing plan definitions shared by the server config and the settings UI.
 *
 * This module must stay free of server-only imports. `app/routes/app.settings.tsx`
 * imports it and that route is part of the client bundle, so anything imported
 * here ends up in the browser build. Importing `~/shopify.server` from a route
 * pulls Prisma and the Shopify server SDK into the client graph and breaks
 * `remix vite:build` with "Server-only module referenced by client".
 *
 * `interval` holds the raw strings Shopify accepts
 * (`BillingInterval.Every30Days === "EVERY_30_DAYS"`). `app/shopify.server.ts`
 * narrows them to the SDK enum when it assembles the billing config.
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
export const BILLING_PLANS = {
  Starter: {
    lineItems: [
      {
        amount: 9,
        currencyCode: "USD",
        interval: "EVERY_30_DAYS",
      },
    ],
  },
  Professional: {
    lineItems: [
      {
        amount: 19,
        currencyCode: "USD",
        interval: "EVERY_30_DAYS",
      },
    ],
  },
  Business: {
    lineItems: [
      {
        amount: 49,
        currencyCode: "USD",
        interval: "EVERY_30_DAYS",
      },
    ],
  },
} as const;

export type BillingPlanKey = keyof typeof BILLING_PLANS;

export const BILLING_PLAN_KEYS = Object.keys(BILLING_PLANS) as BillingPlanKey[];
