import type { LoaderFunctionArgs } from "@remix-run/node";
import shopify from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await shopify.authenticate.admin(request);
    return null;
  } catch (error) {
    // In v4 SDK with unstable_newEmbeddedAuthStrategy, authenticate.admin()
    // throws a Response to redirect to OAuth. We must re-throw it.
    if (error instanceof Response) {
      throw error;
    }
    // Log unexpected errors
    console.error("[AltOptimizer] Auth route unexpected error:", error);
    throw new Response("Authentication failed", { status: 500 });
  }
}
