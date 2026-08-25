import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Page, Card, Text, BlockStack, Button, Link as PolarisLink } from "@shopify/polaris";
import { useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    const apiKey = process.env.SHOPIFY_API_KEY;
    const scopes = "read_products,write_products,read_themes,write_themes,read_content,write_content";
    const appUrl = process.env.SHOPIFY_APP_URL || "https://alt-optimizer.vercel.app";
    const redirectUri = `${appUrl}/auth/callback`;

    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${Date.now()}`;

    return redirect(authUrl);
  }

  return null;
};

export default function Install() {
  const [shop, setShop] = useState("haimo-dev.myshopify.com");

  const handleInstall = () => {
    const appUrl = "https://alt-optimizer.vercel.app";
    const installUrl = `${appUrl}/install?shop=${encodeURIComponent(shop)}`;
    window.open(installUrl, "_blank");
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
            This will open a new tab to complete Shopify OAuth authorization.
          </Text>
        </BlockStack>
      </Card>
    </Page>
  );
}
