import type { LoaderFunctionArgs } from "@remix-run/node";
import prisma from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  if (url.searchParams.get("debug") !== "true") {
    return new Response("Not found", { status: 404 });
  }

  const results: Record<string, any> = {};

  results.env = {
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? "SET (" + process.env.SHOPIFY_API_KEY.slice(0, 8) + "...)" : "MISSING",
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? "SET" : "MISSING",
    SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || "MISSING",
    SESSION_SECRET: process.env.SESSION_SECRET ? "SET" : "MISSING",
    DATABASE_URL: process.env.DATABASE_URL ? "SET (" + process.env.DATABASE_URL.slice(0, 30) + "...)" : "MISSING",
    NODE_ENV: process.env.NODE_ENV || "NOT SET",
  };

  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    results.database = { status: "OK", connected: true };
    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'session'
        ORDER BY ordinal_position
      `;
      results.database.columns = columns;
    } catch (e: any) {
      results.database.columnsError = e.message;
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

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
