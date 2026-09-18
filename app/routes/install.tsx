import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    // Try to get shop from form data
    try {
      const formData = await request.formData();
      const formShop = formData.get("shop") as string | null;
      if (formShop) {
        return redirect(`/auth/login?shop=${encodeURIComponent(formShop.replace(/\.myshopify\.com$/, ""))}`);
      }
    } catch {
      // Not a form submission
    }
    return redirect("/install");
  }

  return redirect(`/auth/login?shop=${encodeURIComponent(shop.replace(/\.myshopify\.com$/, ""))}`);
}

export default function InstallPage() {
  return (
    <div style={{ padding: 40, maxWidth: 600, margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
        AltOptimizer — Install
      </h1>

      <div style={{
        background: "#fff8e1",
        border: "1px solid #ffe082",
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
      }}>
        <p style={{ margin: 0, color: "#5d4037" }}>
          <strong>Session not found.</strong> Please enter your Shopify store domain to (re)install the app.
        </p>
      </div>

      <form method="POST" action="/install" target="_top">
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
            Your Shopify store domain:
          </label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              name="shop"
              placeholder="your-store"
              required
              style={{
                flex: 1,
                padding: "10px 12px",
                border: "1px solid #d0d0d0",
                borderRadius: 6,
                fontSize: 14,
                outline: "none",
              }}
            />
            <span style={{ color: "#666", fontSize: 14 }}>.myshopify.com</span>
          </div>
        </div>

        <button
          type="submit"
          style={{
            display: "inline-block",
            background: "#008060",
            color: "white",
            padding: "12px 24px",
            borderRadius: 8,
            border: "none",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Install AltOptimizer →
        </button>
      </form>

      <p style={{ color: "#666", fontSize: 13, marginTop: 16 }}>
        This will redirect to Shopify to authorize the app.
        After approving permissions, you'll be redirected back to the dashboard.
      </p>

      <div style={{ borderTop: "1px solid #eee", paddingTop: 20, marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>How it works</h3>
        <ol style={{ paddingLeft: 20, color: "#555", lineHeight: 1.8 }}>
          <li>Enter your store domain and click <strong>Install</strong></li>
          <li>Shopify shows the authorization page — click <strong>Install app</strong></li>
          <li>After approval, you're redirected back to the AltOptimizer dashboard</li>
        </ol>
      </div>
    </div>
  );
}
