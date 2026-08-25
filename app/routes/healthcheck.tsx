import type { LoaderFunctionArgs } from "@remix-run/node";
import prisma from "~/db.server";

/**
 * Health check endpoint.
 * Returns 200 if healthy, 503 if database is unreachable.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    if (!prisma) throw new Error("Prisma not initialized");
    await prisma.$queryRaw`SELECT 1`;

    return new Response(
      JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
