import { LoaderFunctionArgs } from "@remix-run/node";
import prisma from "~/db.server";

const APP_URL = process.env.SHOPIFY_APP_URL || "https://alt-optimizer.vercel.app";
const CLIENT_ID = process.env.SHOPIFY_API_KEY || "bf1b9b6eef0ca0ed0584705f23681ddd";
const CLIENT_SECRET = process.env.SHOPIFY_API_SECRET || "";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const shop = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac");
  const state = url.searchParams.get("state");

  console.log("[AltOptimizer] auth callback - shop:", shop, "hasCode:", !!code, "hasHmac:", !!hmac);

  if (!code || !shop) {
    console.error("[AltOptimizer] Missing code or shop param");
    return new Response(null, {
      status: 302,
      headers: { Location: "/install" },
    });
  }

  // Validate HMAC
  if (CLIENT_SECRET) {
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
      console.error("[AltOptimizer] HMAC validation failed");
      return new Response(null, {
        status: 302,
        headers: { Location: "/install" },
      });
    }
    console.log("[AltOptimizer] HMAC validation passed");
  }

  // Exchange code for access token
  const tokenResponse = await fetch(
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

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("[AltOptimizer] Token exchange failed:", tokenResponse.status, errorText);
    return new Response(null, {
      status: 302,
      headers: { Location: "/install" },
    });
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  const scope = tokenData.scope;

  console.log("[AltOptimizer] Token exchange succeeded, scope:", scope);

  // Create/update session in database
  const sessionId = `${shop}_${"offline"}`;

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
    console.log("[AltOptimizer] Session stored successfully");
  } catch (err) {
    console.error("[AltOptimizer] Session storage error:", err);
  }

  // Create/update shop record
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
    } else {
      await prisma.shop.update({
        where: { shopDomain: shop },
        data: {
          status: "active",
          accessToken,
        },
      });
    }
    console.log("[AltOptimizer] Shop record stored successfully");
  } catch (err) {
    console.error("[AltOptimizer] Shop record error:", err);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: `/app?shop=${shop}` },
  });
}

export function ErrorBoundary() {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Authentication Error</h2>
      <p>Please try installing the app again.</p>
      <a href="/install" style={{ color: "#008060" }}>
        Back to Install →
      </a>
    </div>
  );
}
