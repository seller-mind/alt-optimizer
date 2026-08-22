import { useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { Page, Text, Card, BlockStack } from "@shopify/polaris";

interface BoundaryProps {
  error?: unknown;
}

export function Boundary({ error: errorProp }: BoundaryProps) {
  const routeError = useRouteError();
  const error = errorProp || routeError;

  let title = "Something went wrong";
  let message = "An unexpected error occurred. Please try again.";

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = error.data?.message || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <Page title="Error">
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">
            {title}
          </Text>
          <Text as="p" variant="bodyMd">
            {message}
          </Text>
        </BlockStack>
      </Card>
    </Page>
  );
}
