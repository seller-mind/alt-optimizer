import { useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { Page, Card, Text, BlockStack, Button, EmptyState } from "@shopify/polaris";

export function ErrorBoundary() {
  const error = useRouteError();

  let title = "Something went wrong";
  let description = "An unexpected error occurred. Please try again.";
  let showRetry = true;

  if (isRouteErrorResponse(error)) {
    title = `Error ${error.status}`;
    description =
      error.status === 404
        ? "The page you're looking for doesn't exist."
        : error.status === 403
          ? "You don't have permission to access this page."
          : error.data?.message || error.statusText || description;
  } else if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("quota") || msg.includes("rate limit") || msg.includes("429")) {
      title = "Rate Limit Reached";
      description = "The AI service is temporarily rate-limited. Please wait a moment and try again.";
    } else if (msg.includes("timeout") || msg.includes("timed out")) {
      title = "Request Timed Out";
      description = "The request took too long to complete. Please try again.";
    } else if (msg.includes("openai") || msg.includes("api key")) {
      title = "AI Service Configuration Error";
      description = "There's an issue with the AI service configuration. Please check your API key in Settings.";
      showRetry = false;
    } else if (msg.includes("invalid image") || msg.includes("image format")) {
      title = "Invalid Image";
      description = "The image could not be processed. Please try a different image.";
    }
  }

  return (
    <Page>
      <Card>
        <EmptyState heading={title} action={showRetry ? { content: "Try Again", onAction: () => window.location.reload() } : undefined}>
          <Text as="p">{description}</Text>
        </EmptyState>
      </Card>
    </Page>
  );
}