import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import shopify, { authenticate } from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    // OAuth completed successfully — redirect to app dashboard
    return redirect(`/app?shop=${encodeURIComponent(session.shop)}`);
  } catch (error: any) {
    // The SDK throws Response objects for OAuth redirects - must re-throw valid redirects
    if (error instanceof Response) {
      if (error.headers.has("Location")) {
        throw error;
      }
      console.error("[AltOptimizer] Auth redirect missing Location header:", error.status);
    }
    console.error("[AltOptimizer] Auth route error:", {
      name: error?.name,
      message: error?.message,
    });
    return redirect("/install");
  }
}
