import { Outlet, useRouteError } from "@remix-run/react";
import { Box, InlineStack, Text } from "@shopify/polaris";
import { Boundary } from "~/components/Boundary";
import { AppNav } from "~/components/AppNav";
import { authenticate } from "~/shopify.server";
import type { LoaderFunctionArgs } from "@remix-run/node";

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
  const error = useRouteError();
  return <Boundary error={error} />;
}
