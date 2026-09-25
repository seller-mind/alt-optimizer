import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { Page, Card, FormLayout, TextField, Button, BlockStack, Text, Banner } from "@shopify/polaris";
import { useState, useCallback } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const shop = formData.get("shop") as string;

  if (!shop || typeof shop !== "string") {
    return json({ error: "Please enter your shop domain" });
  }

  // Normalize shop domain
  const shopDomain = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return redirect(`/auth/login?shop=${encodeURIComponent(shopDomain)}`);
};

export default function Install() {
  const actionData = useActionData<{ error?: string }>();
  const [shop, setShop] = useState("");

  const handleShopChange = useCallback((value: string) => {
    setShop(value);
  }, []);

  return (
    <Page>
      <BlockStack gap="500">
        {actionData?.error && (
          <Banner tone="critical">
            <p>{actionData.error}</p>
          </Banner>
        )}
        <Card>
          <BlockStack gap="400">
            <Text as="h1" variant="headingLg">
              Install AltOptimizer
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              Enter your Shopify store domain to install AltOptimizer.
            </Text>
            <Form method="post">
              <FormLayout>
                <TextField
                  label="Shop domain"
                  name="shop"
                  value={shop}
                  onChange={handleShopChange}
                  placeholder="your-store.myshopify.com"
                  autoComplete="off"
                />
                <Button submit>Install</Button>
              </FormLayout>
            </Form>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
