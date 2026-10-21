import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

/**
 * Root route.
 *
 * The Shopify Admin loads the app's Application URL (the bare domain, e.g.
 * https://alt-optimizer.vercel.app) when a merchant clicks the app entry in the
 * left sidebar. Before this route existed, that request matched no route, Remix
 * answered 404 and the iframe rendered blank.
 *
 * Always forward to the embedded dashboard, keeping the original query string
 * (shop / host / embedded / hmac) so App Bridge + the token exchange still work.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    return redirect(`/app${url.search}`);
  }

  return redirect("/install");
}

export default function Index() {
  return null;
}
