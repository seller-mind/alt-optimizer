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

  // Try SDK boundary first (handles ErrorResponse types)
  try {
    return boundary.error(error);
  } catch {
    // boundary.error() re-throws non-ErrorResponse errors
    // Fall through to our custom handler
  }

  // Log error details server-side only — never expose internals to users
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
