import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { Page, Card, Text, EmptyState, Button } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import en from "@shopify/polaris/locales/en.json";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";
  const apiKey = process.env.SHOPIFY_API_KEY || "";
  const appUrl = process.env.SHOPIFY_APP_URL || "https://alt-optimizer.vercel.app";

  // If no shop parameter, redirect to install page
  if (!shop) {
    return redirect(`${appUrl}/install?shop=haimo-dev.myshopify.com`, 302);
  }

  return { apiKey, shop };
};

export default function App() {
  const { apiKey, shop } = useLoaderData<typeof loader>();

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
        <AppProvider i18n={en} isEmbeddedApp apiKey={apiKey} shop={shop}>
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
        <AppProvider i18n={en} isEmbeddedApp apiKey={process.env.SHOPIFY_API_KEY || ""}>
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
