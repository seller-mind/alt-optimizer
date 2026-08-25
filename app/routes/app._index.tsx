import { Page, Layout, Card, Text, BlockStack, Banner, Button } from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";

export default function DashboardIndex() {
  const navigate = useNavigate();

  return (
    <Page title="Dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h1" variant="headingXl">
                ✅ AltOptimizer v1.0 is running!
              </Text>
              <Banner title="App loaded successfully" tone="success">
                <BlockStack gap="200">
                  <Text as="p">
                    If you can see this message, the app is working correctly.
                  </Text>
                  <Text as="p">
                    Previous blank page was caused by authentication/database failures during page load.
                  </Text>
                </BlockStack>
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Status Check</Text>
              <Text as="p" variant="bodyMd">✅ React rendering: OK</Text>
              <Text as="p" variant="bodyMd">✅ Polaris components: OK</Text>
              <Text as="p" variant="bodyMd">✅ Remix routing: OK</Text>
              <Text as="p" variant="bodyMd" tone="success">Full features will be restored next.</Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Navigation Test</Text>
              <Button onClick={() => navigate("/app/products")}>Products Page →</Button>
              <Button onClick={() => navigate("/app/settings")}>Settings →</Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
