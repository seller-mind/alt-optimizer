import type { LoaderFunctionArgs } from "@remix-run/node";
import prisma from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  if (url.searchParams.get("debug") !== "true") {
    return new Response("Not found", { status: 404 });
  }

  const results: Record<string, any> = {};

  results.env = {
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY
      ? "SET (" + process.env.SHOPIFY_API_KEY.slice(0, 8) + "...)"
      : "MISSING",
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? "SET" : "MISSING",
    SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || "MISSING",
    SESSION_SECRET: process.env.SESSION_SECRET ? "SET" : "MISSING",
    DATABASE_URL: process.env.DATABASE_URL
      ? "SET (" + process.env.DATABASE_URL.slice(0, 30) + "...)"
      : "MISSING",
    NODE_ENV: process.env.NODE_ENV || "NOT SET",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "SET" : "MISSING",
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? "SET" : "MISSING",
  };

  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    results.database = { status: "OK", connected: true };

    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      results.database.tables = tables;
    } catch (e: any) {
      results.database.tablesError = e.message;
    }

    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'session'
        ORDER BY ordinal_position
      `;
      results.database.sessionColumns = columns;
    } catch (e: any) {
      results.database.sessionColumnsError = e.message;
    }

    try {
      const shopCount = await prisma.shop.count();
      results.database.shopCount = shopCount;
    } catch (e: any) {
      results.database.shopTableError = e.message;
    }
  } catch (e: any) {
    results.database = { status: "FAILED", error: e.message, connected: false };
  }

  try {
    const count = await prisma.session.count();
    results.prisma = { status: "OK", sessionCount: count };
  } catch (e: any) {
    results.prisma = { status: "FAILED", error: e.message };
  }

  // Check if callback URL matches config
  const appUrl = process.env.SHOPIFY_APP_URL || "";
  results.callbackUrl = `${appUrl}/auth/callback`;

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
