import { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import shopify from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const authResult = await shopify.authenticate.admin(request);
  
  // If authenticate returned a session, redirect to app
  if (authResult && "session" in authResult && authResult.session) {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop") || authResult.session.shop;
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/app?shop=${shop}`,
      },
    });
  }
  
  // If authenticate returned a Response (OAuth redirect), pass it through
  // The route-level headers() will add iframe-breakout headers
  if (authResult instanceof Response) {
    return authResult;
  }
  
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const authResult = await shopify.authenticate.admin(request);
  
  if (authResult && "session" in authResult && authResult.session) {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop") || authResult.session.shop;
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/app?shop=${shop}`,
      },
    });
  }
  
  if (authResult instanceof Response) {
    return authResult;
  }
  
  return null;
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs: { actionHeaders: Headers; loaderHeaders: Headers }) => {
  return boundary.headers(headersArgs);
};
