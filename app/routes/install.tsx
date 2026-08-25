import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response("Missing shop parameter. Please add ?shop=your-store.myshopify.com", {
      status: 400,
    });
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  const scopes = "read_products,write_products,read_themes,write_themes,read_content,write_content";
  const appUrl = process.env.SHOPIFY_APP_URL || "https://alt-optimizer.vercel.app";
  const redirectUri = `${appUrl}/auth/callback`;

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${Date.now()}`;

  return redirect(authUrl);
};
