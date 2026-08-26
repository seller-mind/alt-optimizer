import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import shopify from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const errors = await shopify.login(request);
  return json({ errors });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Try SDK login first - it should throw a redirect for OAuth
  const errors = await shopify.login(request);

  // If login returned {} (no errors, no redirect thrown), manually build OAuth URL
  if (!errors || Object.keys(errors).length === 0) {
    const formData = await request.formData();
    const shop = formData.get("shop") as string;

    if (shop) {
      // Normalize shop domain
      let shopDomain = shop.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
      if (!shopDomain.endsWith(".myshopify.com")) {
        shopDomain = `${shopDomain}.myshopify.com`;
      }

      const appUrl = process.env.SHOPIFY_APP_URL || "";
      const apiKey = process.env.SHOPIFY_API_KEY || "";

      const oauthUrl = `https://${shopDomain}/admin/oauth/authorize` +
        `?client_id=${encodeURIComponent(apiKey)}` +
        `&scope=${encodeURIComponent("read_products,write_products,read_themes,write_themes,read_content,write_content")}` +
        `&redirect_uri=${encodeURIComponent(`${appUrl}/auth/callback`)}` +
        `&state=${encodeURIComponent(Math.random().toString(36).substring(2))}`;

      throw redirect(oauthUrl);
    }
  }

  return json({ errors });
};

export default function AuthLogin() {
  return null;
}
