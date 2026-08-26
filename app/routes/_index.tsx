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
              <Banner title="App loaded successfully" tone="success">
                <BlockStack gap="200">
                  <Text as="p">Routing and rendering work correctly.</Text>
                </BlockStack>
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
