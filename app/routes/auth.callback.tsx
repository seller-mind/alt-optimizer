import { LoaderFunctionArgs } from "@remix-run/node";
import { useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import shopify from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const authResult = await shopify.authenticate.admin(request);

    if (authResult && "session" in authResult && authResult.session) {
      const shop = authResult.session.shop;
      return new Response(null, {
        status: 302,
        headers: { Location: `/app?shop=${shop}` },
      });
    }

    if (authResult instanceof Response) {
      return authResult;
    }

    return new Response(null, {
      status: 302,
      headers: { Location: "/install" },
    });
  } catch (error) {
    console.error("[AltOptimizer] auth callback error:", error);
    return new Response(null, {
      status: 302,
      headers: { Location: "/install" },
    });
  }
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs: {
  loaderHeaders: Headers;
}) => {
  return boundary.headers(headersArgs);
};
