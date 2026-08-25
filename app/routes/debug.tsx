export function loader() {
  return new Response(
    JSON.stringify({
      status: "DEPLOYED",
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      env: {
        HAS_DATABASE_URL: !!process.env.DATABASE_URL,
        HAS_SHOPIFY_API_KEY: !!process.env.SHOPIFY_API_KEY,
        HAS_SHOPIFY_API_SECRET: !!process.env.SHOPIFY_API_SECRET,
        SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || "not set",
      },
      message: "If you see this JSON, Vercel deployment is working!",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
