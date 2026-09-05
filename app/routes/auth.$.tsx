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
    // Log full details server-side only
    console.error("[AltOptimizer] Auth callback error:", {
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
