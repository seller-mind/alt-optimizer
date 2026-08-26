import { useState } from "react";

const APP_URL = "https://alt-optimizer.vercel.app";
const CLIENT_ID = "bf1b9b6eef0ca0ed0584705f23681ddd";
const SCOPES = "read_products,write_products,read_themes,write_themes,read_content,write_content";
const REDIRECT_URI = `${APP_URL}/auth/callback`;

export default function InstallPage() {
  const [shop, setShop] = useState("haimo-dev");

  const installUrl = shop
    ? `https://${shop}.myshopify.com/admin/oauth/authorize?client_id=${CLIENT_ID}&scope=${SCOPES}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=random_state`
    : "";

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
        🔧 Install AltOptimizer
      </h1>

      <div style={{
        background: "#fff8e1",
        border: "1px solid #ffe082",
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
      }}>
        <p style={{ margin: 0, color: "#5d4037" }}>
          <strong>Session not found.</strong> The app needs to be (re)installed to create a valid session.
          This can happen if the app was accessed before OAuth completed, or the session expired.
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
          Your Shopify store domain:
        </label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            value={shop}
            onChange={(e) => setShop(e.target.value.replace(/\.myshopify\.com$/, ""))}
            placeholder="your-store"
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

      {shop && installUrl && (
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => { window.top.location.href = installUrl; }}
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
          <p style={{ color: "#666", fontSize: 13, marginTop: 12 }}>
            This will redirect to Shopify to authorize the app.
            After approving permissions, you'll be redirected back to the dashboard.
          </p>
          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", color: "#999", fontSize: 12 }}>Debug: OAuth URL</summary>
            <pre style={{ fontSize: 11, color: "#666", wordBreak: "break-all", whiteSpace: "pre-wrap", marginTop: 8, padding: 8, background: "#f5f5f5", borderRadius: 4 }}>
              {installUrl}
            </pre>
          </details>
        </div>
      )}

      <div style={{ borderTop: "1px solid #eee", paddingTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>How it works</h3>
        <ol style={{ paddingLeft: 20, color: "#555", lineHeight: 1.8 }}>
          <li>Click the <strong>Install</strong> button above</li>
          <li>Shopify shows the authorization page — click <strong>Install app</strong></li>
          <li>After approval, you're redirected back to the AltOptimizer dashboard</li>
          <li>Refresh the app in Shopify Admin to see the full dashboard</li>
        </ol>
      </div>
    </div>
  );
}
