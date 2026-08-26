import { Page, Layout, Card, Text, BlockStack, Banner } from "@shopify/polaris";

export default function Index() {
  return (
    <Page title="Dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h1" variant="headingXl">
                ✅ AltOptimizer is running!
              </Text>
              <Banner title="Routing works" tone="success">
                <Text as="p">If you see this, routing is correct.</Text>
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
