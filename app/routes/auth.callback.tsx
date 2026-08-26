import { LoaderFunctionArgs } from "@remix-run/node";
import prisma from "~/db.server";

const APP_URL = process.env.SHOPIFY_APP_URL || "https://alt-optimizer.vercel.app";
const CLIENT_ID = process.env.SHOPIFY_API_KEY || "bf1b9b6eef0ca0ed0584705f23681ddd";
const CLIENT_SECRET = process.env.SHOPIFY_API_SECRET || "";

function redirectWithLog(url: string, reason: string) {
  console.error(`[AltOptimizer][auth/callback] REDIRECT → ${url} | ${reason}`);
  return new Response(null, { status: 302, headers: { Location: url } });
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
  console.log("[AltOptimizer][auth/callback] state:", state);
  console.log("[AltOptimizer][auth/callback] hasClientSecret:", !!CLIENT_SECRET);
  console.log("[AltOptimizer][auth/callback] full URL:", request.url.replace(/[?].*/, "?***"));

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
      console.error("[AltOptimizer][auth/callback] HMAC mismatch!");
      console.error("[AltOptimizer][auth/callback] expected:", generatedHmac);
      console.error("[AltOptimizer][auth/callback] got:     ", hmac);
      return redirectWithLog("/install", "HMAC validation FAILED");
    }
    console.log("[AltOptimizer][auth/callback] HMAC OK");
  } else {
    console.log("[AltOptimizer][auth/callback] HMAC skipped (secret:", !!CLIENT_SECRET, "hmac:", !!hmac, ")");
  }

  // --- Exchange code for access token ---
  console.log("[AltOptimizer][auth/callback] Exchanging code for token...");
  console.log("[AltOptimizer][auth/callback] POST https://", shop, "/admin/oauth/access_token");
  console.log("[AltOptimizer][auth/callback] client_id:", CLIENT_ID);
  console.log("[AltOptimizer][auth/callback] has client_secret:", !!CLIENT_SECRET);

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
  console.log("[AltOptimizer][auth/callback] accessToken prefix:", accessToken?.slice(0, 10));

  // --- Store session in database ---
  const sessionId = `offline_${shop}`;

  try {
    await prisma.session.upsert({
      where: { id: sessionId },
      update: {
        accessToken,
        scope: scope || "read_products,write_products,read_themes,write_themes,read_content,write_content",
        state: "online",
        isOnline: false,
      },
      create: {
        id: sessionId,
        shop,
        state: "online",
        isOnline: false,
        scope: scope || "read_products,write_products,read_themes,write_themes,read_content,write_content",
        accessToken,
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    console.log("[AltOptimizer][auth/callback] Session stored:", sessionId);
  } catch (err) {
    console.error("[AltOptimizer][auth/callback] Session storage error:", err);
  }

  // --- Store shop record ---
  try {
    const existing = await prisma.shop.findUnique({
      where: { shopDomain: shop },
    });
    if (!existing) {
      await prisma.shop.create({
        data: {
          shopDomain: shop,
          accessToken,
          planType: "free",
          status: "active",
        },
      });
      console.log("[AltOptimizer][auth/callback] Shop record CREATED:", shop);
    } else {
      await prisma.shop.update({
        where: { shopDomain: shop },
        data: {
          status: "active",
          accessToken,
        },
      });
      console.log("[AltOptimizer][auth/callback] Shop record UPDATED:", shop);
    }
  } catch (err) {
    console.error("[AltOptimizer][auth/callback] Shop record error:", err);
  }

  // --- Redirect to /app with shop cookie as fallback ---
  console.log("[AltOptimizer][auth/callback] === SUCCESS, redirecting to /app?shop=", shop);

  return new Response(null, {
    status: 302,
    headers: {
      Location: `/app?shop=${shop}`,
      "Set-Cookie": `shop_domain=${encodeURIComponent(shop)}; Path=/; Max-Age=31536000; SameSite=None; Secure`,
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
