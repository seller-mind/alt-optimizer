import { useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { Page, Text, Card, BlockStack, EmptyState, Button } from "@shopify/polaris";

interface BoundaryProps {
  error?: unknown;
}

export function Boundary({ error: errorProp }: BoundaryProps) {
  const routeError = useRouteError();
  const error = errorProp || routeError;

  let title = "Something went wrong";
  let description = "An unexpected error occurred. Please try again.";
  let showRetry = true;

  if (isRouteErrorResponse(error)) {
    title = `Error ${error.status}`;
    switch (error.status) {
      case 404:
        description = "The page you're looking for doesn't exist or has been removed.";
        break;
      case 403:
        description = "You don't have permission to access this page. Please contact your Shopify admin.";
        showRetry = false;
        break;
      case 401:
        description = "Your session has expired. Please refresh the page to re-authenticate.";
        break;
      case 429:
        description = "Too many requests. Please wait a moment and try again.";
        break;
      case 500:
        description = "The server encountered an internal error. Our team has been notified.";
        break;
      default:
        description = error.statusText || description;
    }
  } else if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("quota") || msg.includes("rate limit") || msg.includes("429") || msg.includes("too many")) {
      title = "Rate Limit Reached";
      description = "The AI service is temporarily rate-limited. Please wait a moment and try again.";
    } else if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("abort")) {
      title = "Request Timed Out";
      description = "The request took too long to complete. The AI service may be experiencing high load. Please try again.";
    } else if (msg.includes("openai") || msg.includes("api key") || msg.includes("auth")) {
      title = "AI Service Configuration Error";
      description = "There's an issue with the AI service configuration. Please check your API key in Settings.";
      showRetry = false;
    } else if (msg.includes("invalid image") || msg.includes("image format") || msg.includes("base64")) {
      title = "Invalid Image";
      description = "The image could not be processed. It may be corrupted or in an unsupported format.";
    } else if (msg.includes("network") || msg.includes("fetch") || msg.includes("econnrefused")) {
      title = "Network Error";
      description = "Unable to connect to the server. Please check your internet connection and try again.";
    } else if (msg.includes("not found") || msg.includes("missing")) {
      title = "Data Not Found";
      description = "The requested data could not be found. It may have been deleted or not yet synced.";
    } else {
      description = error.message;
    }
  }

  return (
    <Page>
      <Card>
        <EmptyState
          heading={title}
          action={
            showRetry
              ? {
                  content: "Try Again",
                  onAction: () => window.location.reload(),
                }
              : undefined
          }
          secondaryAction={{
            content: "Go to Dashboard",
            onAction: () => {
              window.location.href = "/app";
            },
          }}
        >
          <Text as="p">{description}</Text>
        </EmptyState>
      </Card>
    </Page>
  );
}