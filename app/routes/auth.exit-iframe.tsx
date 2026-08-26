import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import shopify from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const appUrl = process.env.SHOPIFY_APP_URL || "https://localhost:3000";
  let targetUrl = `${appUrl}/app`;
  try {
    const { session } = await shopify.authenticate.admin(request);
    if (!session) {
      targetUrl = `${appUrl}/auth`;
    }
  } catch {
    targetUrl = `${appUrl}/auth`;
  }
  return json({ targetUrl });
};

export default function AuthExitIframe() {
  const { targetUrl } = useLoaderData<typeof loader>();
  if (typeof window !== "undefined" && window.top) {
    window.top.location.href = targetUrl;
  }
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <p>Redirecting...</p>
      <a href={targetUrl}>Click here if not redirected</a>
    </div>
  );
}