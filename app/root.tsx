import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import en from "@shopify/polaris/locales/en.json";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async () => {
  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
  });
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

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
        <AppProvider i18n={en} apiKey={apiKey} isEmbeddedApp={true}>
          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}