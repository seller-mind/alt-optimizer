// /robots.txt
//
// The app is an embedded Shopify admin app: every meaningful route requires an
// authenticated admin session, so there is nothing for crawlers to index.
// Serving an explicit Disallow also stops the Remix router from throwing a
// "No route matches URL /robots.txt" error into the runtime logs on every probe.

export const loader = () => {
  const body = ["User-agent: *", "Disallow: /", ""].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
