import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/react";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const results: Record<string, any> = {};

  // 1. Check session
  try {
    const { session, admin } = await authenticate.admin(request);
    results.session = {
      shop: session.shop,
      id: session.id,
      isOnline: session.isOnline,
      expires: session.expires ? new Date(session.expires * 1000).toISOString() : "never",
      tokenPrefix: session.accessToken?.substring(0, 15) + "...",
      tokenLength: session.accessToken?.length || 0,
    };

    // 2. Check DB session record
    const dbSession = await prisma.session.findFirst({
      where: { shop: session.shop },
    });
    results.dbSession = dbSession ? {
      id: dbSession.id,
      shop: dbSession.shop,
      expires: dbSession.expires,
      tokenPrefix: dbSession.accessToken?.substring(0, 15) + "...",
    } : null;

    // 3. Check shops record
    const shopRecord = await prisma.shop.findUnique({
      where: { shopDomain: session.shop },
    });
    results.shopRecord = shopRecord ? {
      domain: shopRecord.shopDomain,
      status: shopRecord.status,
      tokenPrefix: shopRecord.accessToken?.substring(0, 15) + "...",
    } : null;

    // 4. Test Shopify API call
    try {
      const shopResp = await admin.graphql(`{ shop { name myshopifyDomain } }`);
      const shopData = await shopResp.json();
      results.apiTest = {
        success: !shopData.errors,
        data: shopData.data,
        errors: shopData.errors || null,
      };
    } catch (apiErr: any) {
      results.apiTest = {
        success: false,
        error: apiErr.message,
        status: apiErr.status || apiErr.response?.status,
        body: apiErr.body || apiErr.response?.body,
      };
    }
  } catch (authErr: any) {
    results.authError = authErr.message;
  }

  return json(results);
};
