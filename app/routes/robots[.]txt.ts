// /robots.txt
//
// Almost every route is an embedded Shopify admin app that needs an
// authenticated admin session, so there is nothing for a crawler to index.
//
// The exception is /scanner: a public, login-free alt-text checker that is
// meant to be linked to and found. It is allowed explicitly, together with the
// bare domain (which 302s to it). Everything else stays disallowed so admin
// routes never land in a search index.
//
// Serving this file also stops the Remix router from throwing a
// "No route matches URL /robots.txt" error into the runtime logs on every probe.

export const loader = () => {
  const body = [
    "User-agent: *",
    "Allow: /scanner",
    "Allow: /$",
    "Disallow: /",
    "",
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
