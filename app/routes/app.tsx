import { Outlet, useRouteError } from "@remix-run/react";
import { Box, InlineStack, Text } from "@shopify/polaris";
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
  return boundary.error(useRouteError());
}

export const headers = (headersArgs: {
  actionHeaders: Headers;
  loaderHeaders: Headers;
}) => {
  return boundary.headers(headersArgs);
};
