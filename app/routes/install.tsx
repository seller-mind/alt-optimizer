import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Page, Card, Text, BlockStack, Button, FormLayout, TextField } from "@shopify/polaris";
import { useState } from "react";
import { Form, useActionData } from "@remix-run/react";
import type { ActionFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    return redirect(`/app?shop=${encodeURIComponent(shop)}`);
  }

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const shop = formData.get("shop") as string;
  
  if (shop) {
    return redirect(`/app?shop=${encodeURIComponent(shop)}`);
  }
  
  return { error: "Please enter a valid shop domain" };
};

export default function Install() {
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");

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
          <Form method="post">
            <FormLayout>
              <TextField
                type="text"
                name="shop"
                label="Shop domain"
                helpText="e.g: my-shop.myshopify.com"
                value={shop}
                onChange={setShop}
                autoComplete="on"
                error={actionData?.error}
              />
              <Button submit variant="primary">
                Install App →
              </Button>
            </FormLayout>
          </Form>
        </BlockStack>
      </Card>
    </Page>
  );
}
