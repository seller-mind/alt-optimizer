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
 * Two different visitors share this route:
 *
 *   - With a `shop` param: the Shopify Admin loading the app's Application URL.
 *     Forward to the embedded dashboard, keeping the original query string
 *     (shop / host / embedded / hmac) so App Bridge + the token exchange still
 *     work. This branch must not change — the iframe depends on it.
 *   - Without it: someone who typed the bare domain. Send them to the public
 *     scanner, the only page on this host written for people who are not
 *     logged in. `/install` is still reachable from there.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  const target = shop ? `/app${url.search}` : "/scanner";
  console.log(`[AltOptimizer] root route ${url.pathname}${url.search} -> ${target}`);

  return redirect(target);
}

export default function Index() {
  return null;
}
