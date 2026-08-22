import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Box,
} from "@shopify/polaris";
import { Boundary } from "~/components/Boundary";
import shopifyApp, { authenticate } from "~/shopify.server";
import { AppNav } from "~/components/AppNav";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function AppLayout() {
  return (
    <>
      <AppNav />
      <Outlet />
    </>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return <Boundary error={error} />;
}

export const headers: HeadersFunction = (headersParams) => {
  return shopifyApp.addDocumentResponseHeaders(headersParams);
};
