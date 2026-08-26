import type { LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // No SDK calls - just render the install form
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
