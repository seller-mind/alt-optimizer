import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import shopify from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await shopify.authenticate.admin(request);
  const appUrl = process.env.SHOPIFY_APP_URL || "https://localhost:3000";
  if (session) {
    return redirect(`${appUrl}/app`);
  }
  return redirect(`${appUrl}/auth`);
};

export default function AuthExitIframe() {
  return null;
}
