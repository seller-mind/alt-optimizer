import { useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Page, Layout, Card, Text, BlockStack, Banner } from "@shopify/polaris";
import shopify from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await shopify.authenticate.admin(request);
  return { shop: session?.shop || "unknown" };
};

export default function Index() {
  const { shop } = useLoaderData<typeof loader>();

  return (
    <Page title="Dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h1" variant="headingXl">
                ✅ AltOptimizer is running!
              </Text>
              <Banner title="App loaded successfully" tone="success">
                <BlockStack gap="200">
                  <Text as="p">Connected to: {shop}</Text>
                  <Text as="p">The app is working correctly.</Text>
                </BlockStack>
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
