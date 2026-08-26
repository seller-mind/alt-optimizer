import { LoaderFunctionArgs } from "@remix-run/node";

const APP_URL = process.env.SHOPIFY_APP_URL || "https://alt-optimizer.vercel.app";
const CLIENT_ID = process.env.SHOPIFY_API_KEY || "bf1b9b6eef0ca0ed0584705f23681ddd";
const CLIENT_SECRET = process.env.SHOPIFY_API_SECRET || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "alt-optimizer-dev-secret-change-me";

function redirectWithLog(url: string, reason: string) {
  console.error(`[AltOptimizer][auth/callback] REDIRECT → ${url} | ${reason}`);
  return new Response(null, { status: 302, headers: { Location: url } });
}

async function signPayload(payload: string): Promise<string> {
  const crypto = await import("crypto");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const shop = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac");
  const state = url.searchParams.get("state");

  console.log("[AltOptimizer][auth/callback] === START ===");
  console.log("[AltOptimizer][auth/callback] shop:", shop);
  console.log("[AltOptimizer][auth/callback] hasCode:", !!code, "code:", code?.slice(0, 10));
  console.log("[AltOptimizer][auth/callback] hasHmac:", !!hmac);
  console.log("[AltOptimizer][auth/callback] hasClientSecret:", !!CLIENT_SECRET);

  if (!code || !shop) {
    return redirectWithLog("/install", `Missing code=${!!code} or shop=${!!shop}`);
  }

  // --- HMAC validation ---
  if (CLIENT_SECRET && hmac) {
    const message = Object.keys(url.searchParams)
      .filter((k) => k !== "hmac" && k !== "signature")
      .sort()
      .map((k) => `${k}=${url.searchParams.get(k)}`)
      .join("&");

    const crypto = await import("crypto");
    const generatedHmac = crypto
      .createHmac("sha256", CLIENT_SECRET)
      .update(message)
      .digest("hex");

    if (generatedHmac !== hmac) {
      console.error("[AltOptimizer][auth/callback] HMAC MISMATCH!");
      console.error("[AltOptimizer][auth/callback] expected:", generatedHmac);
      console.error("[AltOptimizer][auth/callback] got:     ", hmac);
      return redirectWithLog("/install", "HMAC validation FAILED");
    }
    console.log("[AltOptimizer][auth/callback] HMAC OK");
  } else {
    console.log("[AltOptimizer][auth/callback] HMAC skipped");
  }

  // --- Exchange code for access token ---
  console.log("[AltOptimizer][auth/callback] Exchanging code for token...");
  console.log("[AltOptimizer][auth/callback] POST https://", shop, "/admin/oauth/access_token");

  let tokenResponse;
  try {
    tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
        }),
      }
    );
  } catch (fetchErr) {
    console.error("[AltOptimizer][auth/callback] Fetch error:", fetchErr);
    return redirectWithLog("/install", `Fetch error: ${fetchErr}`);
  }

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("[AltOptimizer][auth/callback] Token exchange FAILED:", tokenResponse.status, errorText);
    return redirectWithLog("/install", `Token exchange failed: ${tokenResponse.status} ${errorText.slice(0, 200)}`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  const scope = tokenData.scope;

  console.log("[AltOptimizer][auth/callback] Token exchange SUCCESS, scope:", scope);

  // --- Store session in signed cookie ---
  // Format: base64(json({shop, accessToken, scope, expires}))
  const sessionData = {
    shop,
    accessToken,
    scope: scope || "read_products,write_products,read_themes,write_themes,read_content,write_content",
    expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  const payload = Buffer.from(JSON.stringify(sessionData)).toString("base64url");
  const signedPayload = await signPayload(payload);

  // Cookie value: signed payload (URL-safe)
  const cookieValue = encodeURIComponent(signedPayload);
  const cookieMaxAge = 30 * 24 * 60 * 60; // 30 days in seconds

  console.log("[AltOptimizer][auth/callback] Session cookie created for:", shop);
  console.log("[AltOptimizer][auth/callback] Cookie size:", cookieValue.length, "bytes");
  console.log("[AltOptimizer][auth/callback] === SUCCESS, redirecting to /app");

  // Set multiple cookies for easy access
  const cookies = [
    `altopt_shop=${encodeURIComponent(shop)}; Path=/; Max-Age=${cookieMaxAge}; SameSite=None; Secure`,
    `altopt_token=${cookieValue}; Path=/; Max-Age=${cookieMaxAge}; SameSite=None; Secure; HttpOnly`,
  ];

  return new Response(null, {
    status: 302,
    headers: {
      Location: `/app?shop=${shop}`,
      "Set-Cookie": cookies.join(", "),
    },
  });
}

export function ErrorBoundary() {
  return (
    <div style={{ padding: 40, fontFamily: "monospace" }}>
      <h2>Authentication Error</h2>
      <p>Check server logs for details.</p>
      <a href="/install" style={{ color: "#008060" }}>
        Back to Install →
      </a>
    </div>
  );
}
