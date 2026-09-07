import type { LoaderFunctionArgs } from "@remix-run/node";
import shopify from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await shopify.authenticate.admin(request);
    return null;
  } catch (error: any) {
    // The SDK throws Response objects for OAuth redirects - must re-throw valid redirects
    if (error instanceof Response) {
      // Ensure the redirect has a Location header before re-throwing
      if (error.headers.has("Location")) {
        throw error;
      }
      // Response without Location is invalid - log and return error
      console.error("[AltOptimizer] Auth redirect missing Location header:", error.status);
    }
    // Log full details server-side only
    console.error("[AltOptimizer] Auth route error:", {
      name: error?.name,
      message: error?.message,
    });
    // Return generic error to client - never leak stack traces
    return new Response(
      JSON.stringify({
        error: "AUTH_CALLBACK_FAILED",
        message: "Authentication failed. Please try installing the app again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
