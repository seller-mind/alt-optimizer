import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Page, Card, Text, BlockStack, Button } from "@shopify/polaris";
import { useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  // If shop param is present, redirect to /app which triggers authenticate.admin()
  // The SDK handles the full OAuth flow automatically
  if (shop) {
    return redirect(`/app?shop=${encodeURIComponent(shop)}`);
  }

  return null;
};

export default function Install() {
  const [shop, setShop] = useState("haimo-dev.myshopify.com");

  const handleInstall = () => {
    const appUrl = "https://alt-optimizer.vercel.app";
    window.location.href = `${appUrl}/app?shop=${encodeURIComponent(shop)}`;
  };

  return (
    <Page>
      <Card>
        <BlockStack gap="400">
          <Text as="h1" variant="headingXl">
            Install AltOptimizer
          </Text>
          <Text as="p">
            Enter your Shopify store domain to begin installation.
          </Text>
          <input
            type="text"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            placeholder="your-store.myshopify.com"
            style={{
              padding: "8px 12px",
              border: "1px solid #dfe3e8",
              borderRadius: "4px",
              fontSize: "14px",
              width: "100%",
              maxWidth: "400px",
            }}
          />
          <Button variant="primary" onClick={handleInstall}>
            Install App →
          </Button>
          <Text as="p" variant="bodySm" tone="subdued">
            You will be redirected to Shopify to authorize the app.
          </Text>
        </BlockStack>
      </Card>
    </Page>
  );
}
