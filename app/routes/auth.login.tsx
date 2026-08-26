import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { Page, Card, Text, BlockStack, Button, FormLayout, TextField } from "@shopify/polaris";
import { useState } from "react";
import { Form } from "@remix-run/react";
import shopify from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const errors = await shopify.login(request);
  return json({ errors });
}

export async function action({ request }: ActionFunctionArgs) {
  const errors = await shopify.login(request);
  return json({ errors });
}

export default function Auth() {
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
            Enter your Shopify store domain to authorize the app.
          </Text>
          <Form method="post">
            <FormLayout>
              <TextField
                type="text"
                name="shop"
                label="Shop domain"
                helpText="e.g: my-shop-domain.myshopify.com"
                value={shop}
                onChange={setShop}
                autoComplete="on"
                error={actionData?.errors?.shop}
              />
              <Button submit variant="primary">
                Install App
              </Button>
            </FormLayout>
          </Form>
        </BlockStack>
      </Card>
    </Page>
  );
}
