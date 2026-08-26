import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import shopify from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    // SDK detected shop param - initiate OAuth directly
    // Build Shopify OAuth URL manually since SDK redirects back to /auth
    const apiKey = process.env.SHOPIFY_API_KEY || "";
    const appUrl = process.env.SHOPIFY_APP_URL || "https://alt-optimizer.vercel.app";
    const scopes = "read_products,write_products,read_themes,write_themes,read_content,write_content";
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Normalize shop domain
    let shopDomain = shop.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!shopDomain.endsWith(".myshopify.com")) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    const oauthUrl = `https://${shopDomain}/admin/oauth/authorize` +
      `?client_id=${encodeURIComponent(apiKey)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&redirect_uri=${encodeURIComponent(`${appUrl}/auth/callback`)}` +
      `&state=${encodeURIComponent(state)}`;

    console.log("[AltOptimizer] Initiating OAuth redirect to:", oauthUrl);
    throw redirect(oauthUrl);
  }

  // No shop param - render install form
  return null;
};

export default function Auth() {
  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 480, margin: "60px auto", padding: "0 20px", color: "#202223" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Install AltOptimizer</h1>
      <p style={{ color: "#6d7175", marginBottom: 24 }}>Enter your Shopify store domain to authorize the app.</p>
      <form method="post" action="/auth/login">
        <label htmlFor="shop" style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Shop domain</label>
        <input
          type="text"
          id="shop"
          name="shop"
          placeholder="my-shop.myshopify.com"
          autoComplete="on"
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #c9cccf", borderRadius: 4, fontSize: 14, boxSizing: "border-box" }}
        />
        <div style={{ fontSize: 12, color: "#6d7175", marginTop: 4 }}>e.g: haimo-dev.myshopify.com</div>
        <button type="submit" style={{ marginTop: 16, width: "100%", padding: "10px 20px", background: "#2c6ecb", color: "#fff", border: "none", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Install App</button>
      </form>
    </div>
  );
}
