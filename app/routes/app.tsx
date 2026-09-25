import { Outlet, useRouteError } from "@remix-run/react";
import { Box, InlineStack, Text, Card, BlockStack } from "@shopify/polaris";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppNav } from "~/components/AppNav";

export default function AppLayout() {
  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <AppNav />
      <Box flex={1} padding="400">
        <Outlet />
      </Box>
      <Box
        padding="300"
        borderBlockStart="025"
        background="bg-surface-secondary"
      >
        <InlineStack align="center" blockAlign="center">
          <Text as="p" variant="bodySm" tone="subdued">
            AltOptimizer v1.0.0
          </Text>
        </InlineStack>
      </Box>
    </Box>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  // Handle Shopify SDK errors (401/403) — triggers re-auth in embedded apps
  try {
    return boundary.error(error);
  } catch {
    // boundary.error() re-throws non-ErrorResponse errors — fall through
  }

  // Handle 410 Gone (expired offline access tokens) — redirect to re-auth
  const err = error as { status?: number; data?: { shop?: string } };
  if (err?.status === 410) {
    const shop = err?.data?.shop || "";
    if (typeof window !== "undefined") {
      // Always use window.top to break out of iframe if embedded
      window.top.location.href = `/auth/login?shop=${encodeURIComponent(shop)}`;
    }
  }

  console.error("[AltOptimizer] ErrorBoundary caught:", error);

  return (
    <Box padding="600">
      <Card>
        <BlockStack gap="400">
          <Text as="h1" variant="headingLg" tone="critical">
            Something went wrong
          </Text>
          <Text as="p" variant="bodyMd">
            An unexpected error occurred. Please try refreshing the page.
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            If the problem persists, contact support through the Shopify App Store.
          </Text>
        </BlockStack>
      </Card>
    </Box>
  );
}

export const headers = (headersArgs: {
  actionHeaders: Headers;
  loaderHeaders: Headers;
}) => {
  return boundary.headers(headersArgs);
};
