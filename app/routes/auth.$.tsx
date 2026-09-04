import type { LoaderFunctionArgs } from "@remix-run/node";
import shopify from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await shopify.authenticate.admin(request);
    return null;
  } catch (error: any) {
    // v4 SDK throws Response objects for OAuth redirects - must re-throw
    if (error instanceof Response) {
      throw error;
    }
    // Return detailed error to browser for diagnosis
    console.error("[AltOptimizer] Auth callback error:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack?.split("\n").slice(0, 5).join("\n"),
    });
    return new Response(
      JSON.stringify({
        error: "AUTH_CALLBACK_FAILED",
        name: error?.name || "Unknown",
        message: error?.message || String(error),
        stack: error?.stack?.split("\n").slice(0, 8).join("\n"),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
