import { Outlet, useRouteError } from "@remix-run/react";
import { Box, InlineStack, Text, Card, BlockStack, Button } from "@shopify/polaris";
import { boundary } from "@shopify/shopify-app-remix/server";
import { useActionData } from "@remix-run/react";

export default function AppLayout() {
  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <Box flex={1}>
        <Outlet />
      </Box>
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
          </InlineStack>
        </InlineStack>
      </Box>
    </Box>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs: {
  actionHeaders: Headers;
  loaderHeaders: Headers;
}) => {
  return boundary.headers(headersArgs);
};
