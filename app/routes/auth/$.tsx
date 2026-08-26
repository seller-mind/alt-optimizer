import { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import shopify from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await shopify.authenticate.admin(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  await shopify.authenticate.admin(request);
  return null;
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs: { actionHeaders: Headers; loaderHeaders: Headers }) => {
  return boundary.headers(headersArgs);
};
