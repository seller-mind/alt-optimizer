import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError, isRouteErrorResponse, useLocation } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { Page, Card, Text, EmptyState, Button } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import en from "@shopify/polaris/locales/en.json";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export default function App() {
  const location = useLocation();

  // If there's a shop query param but we're not on a valid route,
  // redirect to install to start OAuth
  if (location.search.includes("shop=") && location.pathname === "/") {
    const params = new URLSearchParams(location.search);
    const shop = params.get("shop");
    if (shop) {
      window.location.href = `/install?shop=${shop}`;
      return null;
    }
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AltOptimizer - AI Product Optimizer</title>
        <Meta />
        <Links />
      </head>
      <body>
        <AppProvider i18n={en} isEmbeddedApp>
          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let title = "Something went wrong";
  let description = "An unexpected error occurred. Please try again.";

  if (isRouteErrorResponse(error)) {
    title = `Error ${error.status}`;
    description =
      error.status === 404
        ? "The page you're looking for doesn't exist."
        : error.status === 403
          ? "You don't have permission to access this page."
          : error.statusText || description;
  } else if (error instanceof Error) {
    description = error.message || description;
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AltOptimizer - Error</title>
        <Meta />
        <Links />
        <link rel="stylesheet" href={polarisStyles} />
      </head>
      <body>
        <AppProvider i18n={en} isEmbeddedApp>
          <Page>
            <Card>
              <EmptyState
                heading={title}
                action={{ content: "Try Again", onAction: () => window.location.reload() }}
              >
                <Text as="p">{description}</Text>
              </EmptyState>
            </Card>
          </Page>
        </AppProvider>
        <Scripts />
      </body>
    </html>
  );
}
