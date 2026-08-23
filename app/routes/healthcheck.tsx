import type { LoaderFunctionArgs } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Health check endpoint for Render platform.
 * Render pings this URL to verify the service is running.
 * Returns 200 if healthy, 503 if not.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Verify database connection
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