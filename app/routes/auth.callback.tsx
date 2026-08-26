import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

/**
 * OAuth callback route — /auth/callback
 * The SDK's authenticate.admin() exchanges the code for a session
 * and automatically handles the redirect back to the app.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return new Response(null, { status: 200 });
};
