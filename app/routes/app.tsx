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

  // Custom error display for non-Response errors
  const errorMessage = error instanceof Error
    ? `${error.name}: ${error.message}`
    : typeof error === "string"
      ? error
      : JSON.stringify(error);

  const errorStack = error instanceof Error ? error.stack : undefined;

  return (
    <Box padding="600">
      <Card>
        <BlockStack gap="400">
          <Text as="h1" variant="headingLg" tone="critical">
            Application Error
          </Text>
          <Text as="p" variant="bodyMd">
            Something went wrong. Please try refreshing the page.
          </Text>
          <Box padding="300" borderRadius="200" background="bg-surface-secondary">
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" fontWeight="semibold" tone="critical">
                Error Details:
              </Text>
              <Text as="p" variant="bodySm" monospace>
                {errorMessage}
              </Text>
              {errorStack && (
                <Text as="p" variant="bodyXs" monospace tone="subdued">
                  {errorStack.split("\n").slice(0, 5).join("\n")}
                </Text>
              )}
            </BlockStack>
          </Box>
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
