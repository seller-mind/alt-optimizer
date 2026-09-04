import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/react";
import prisma from "~/db.server";

// Unauthenticated diagnostic endpoint — checks DB directly
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const results: Record<string, any> = {};
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "haimo-dev.myshopify.com";

  // 1. Check ALL session records for this shop
  try {
    const dbSessions = await prisma.session.findMany({
      where: { shop },
    });
    results.dbSessions = dbSessions.map((s) => ({
      id: s.id,
      shop: s.shop,
      scope: s.scope,
      isOnline: s.isOnline,
      expires: s.expires ? s.expires.toISOString() : null,
      expiresType: typeof s.expires,
      accessTokenPrefix: s.accessToken?.substring(0, 20) + "...",
      accessTokenLength: s.accessToken?.length || 0,
    }));
  } catch (e: any) {
    results.dbSessionsError = e.message;
  }

  // 2. Check shops record
  try {
    const shopRecord = await prisma.shop.findUnique({
      where: { shopDomain: shop },
    });
    results.shopRecord = shopRecord ? {
      domain: shopRecord.shopDomain,
      status: shopRecord.status,
      accessTokenPrefix: shopRecord.accessToken?.substring(0, 20) + "...",
    } : null;
  } catch (e: any) {
    results.shopRecordError = e.message;
  }

  // 3. Test API with shops token
  try {
    const shopRecord = await prisma.shop.findUnique({
      where: { shopDomain: shop },
    });
    if (shopRecord?.accessToken) {
      const resp = await fetch(`https://${shop}/admin/api/2026-07/shop.json`, {
        headers: { "X-Shopify-Access-Token": shopRecord.accessToken },
      });
      results.apiTest = {
        status: resp.status,
        ok: resp.ok,
        body: (await resp.text()).slice(0, 500),
      };
    } else {
      results.apiTest = { error: "No access token in shops table" };
    }
  } catch (e: any) {
    results.apiTest = { error: e.message };
  }

  return json(results);
};
