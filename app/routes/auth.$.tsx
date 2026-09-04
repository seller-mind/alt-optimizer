import type { LoaderFunctionArgs } from "@remix-run/node";
import shopify from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await shopify.authenticate.admin(request);
    return null;
  } catch (error: any) {
    console.error("[Auth] Callback error:", {
      message: error.message,
      stack: error.stack?.split("\n").slice(0, 5).join("\n"),
      name: error.name,
    });
    return new Response(
      JSON.stringify({
        error: error.message,
        name: error.name,
        stack: error.stack?.split("\n").slice(0, 3).join("\n"),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
