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
import { getShopifySafe, authenticate } from "~/shopify.server";
import { AppNav } from "~/components/AppNav";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function AppLayout() {
  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <AppNav />
      <Box flex={1}>
        <Outlet />
      </Box>
      {/* App Footer */}
      <Box
        padding="300"
        borderBlockStart="025"
        background="bg-surface-secondary"
      >
        <InlineStack align="space-between" blockAlign="center" wrap={false}>
          <InlineStack gap="400" wrap={false}>
            <Text as="p" variant="bodySm" tone="subdued">
              AltOptimizer v1.0.0
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              <Link to="/privacy" style={{ textDecoration: "none" }}>
                Privacy Policy
              </Link>
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              <Link to="/terms" style={{ textDecoration: "none" }}>
                Terms of Service
              </Link>
            </Text>
          </InlineStack>
          <Text as="p" variant="bodySm" tone="subdued">
            Support: support@altoptimizer.com
          </Text>
        </InlineStack>
      </Box>
    </Box>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return <Boundary error={error} />;
}

export const headers: HeadersFunction = (headersParams) => {
  const shopify = getShopifySafe();
  if (shopify) {
    return shopify.addDocumentResponseHeaders(headersParams);
  }
  return new Headers();
};