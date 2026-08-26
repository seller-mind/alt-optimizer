import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import shopify from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Handle OAuth callback code exchange, then redirect to /app
  const { session } = await shopify.authenticate.admin(request);
  if (session) {
    return redirect("/app");
  }
  return redirect("/auth");
};

export default function AuthExitIframe() {
  return null;
}
