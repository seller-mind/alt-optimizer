import { useEffect } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  isRouteErrorResponse,
  useLocation,
} from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import en from "@shopify/polaris/locales/en.json";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  // If no shop param and we're at root or /app routes, redirect to install
  if (!shop && (url.pathname === "/" || url.pathname === "/app" || url.pathname.startsWith("/app/"))) {
    return redirect("/install");
  }

  return null;
};

export default function App() {
  const location = useLocation();

  // Client-side redirect for shop param — useEffect only runs on client
  useEffect(() => {
    if (location.search.includes("shop=") && location.pathname === "/") {
      const params = new URLSearchParams(location.search);
      const shop = params.get("shop");
      if (shop) {
        window.location.href = `/install?shop=${shop}`;
      }
    }
  }, [location]);

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
  let description = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    title = `Error ${error.status}`;
    if (error.status === 404) {
      description = "The page you're looking for doesn't exist.";
    } else if (error.status === 403) {
      description = "You don't have permission to access this page.";
    } else {
      description = error.statusText || description;
    }
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
          <div style={{ padding: 40, textAlign: "center" }}>
            <h2>{title}</h2>
            <p>{description}</p>
            <p style={{ marginTop: 20 }}>
              <a href="/install">Go to Install Page</a>
            </p>
          </div>
        </AppProvider>
        <Scripts />
      </body>
    </html>
  );
}
