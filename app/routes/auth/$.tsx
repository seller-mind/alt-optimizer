import { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import shopify from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await shopify.authenticate.admin(request);
    // OAuth completed successfully — redirect to app
    if (session) {
      const url = new URL(request.url);
      const shop = url.searchParams.get("shop") || session.shop;
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/app?shop=${shop}`,
          "X-Frame-Options": "ALLOWALL",
        },
      });
    }
    return null;
  } catch (error) {
    console.error("[AltOptimizer] Auth error:", error);
    throw error;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { session } = await shopify.authenticate.admin(request);
    if (session) {
      const url = new URL(request.url);
      const shop = url.searchParams.get("shop") || session.shop;
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/app?shop=${shop}`,
          "X-Frame-Options": "ALLOWALL",
        },
      });
    }
    return null;
  } catch (error) {
    console.error("[AltOptimizer] Auth action error:", error);
    throw error;
  }
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs: { actionHeaders: Headers; loaderHeaders: Headers }) => {
  return boundary.headers(headersArgs);
};
