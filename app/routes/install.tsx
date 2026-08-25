import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

/**
 * Public OAuth install route.
 * Access: /install?shop=haimo-dev.myshopify.com
 * Breaks out of iframe to complete OAuth at top level.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";
  const apiKey = process.env.SHOPIFY_API_KEY || "";
  const appUrl = process.env.SHOPIFY_APP_URL || "https://alt-optimizer.vercel.app";
  const scopes = "read_products,write_products,read_themes,write_themes,read_content,write_content";
  const redirectUri = `${appUrl}/auth/callback`;

  if (!shop || !apiKey) {
    return new Response(
      JSON.stringify({
        error: "Missing shop parameter or API key",
        shop,
        hasApiKey: !!apiKey,
        installLink: appUrl ? `${appUrl}/install?shop=haimo-dev.myshopify.com` : "",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const shopDomain = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const authUrl = `https://${shopDomain}/admin/oauth/authorize?client_id=${apiKey}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return redirect(authUrl, 302);
};
