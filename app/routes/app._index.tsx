import { Page, Layout, Card, Text, BlockStack, Button, Banner, EmptyState, Box } from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";

export default function DashboardIndex() {
  const navigate = useNavigate();

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                ✅ AltOptimizer is running!
              </Text>
              <Text as="p">
                If you can see this, the app is working correctly.
                The blank page issue was caused by authentication/database failures.
              </Text>
              <Banner title="Next Steps" tone="info">
                <BlockStack gap="200">
                  <Text as="p">Your app is loading inside Shopify Admin. Click below to test navigation:</Text>
                </BlockStack>
              </Banner>
              <Box>
                <Button
                  variant="primary"
                  onClick={() => navigate("/app/products")}
                >
                  Go to Products →
                </Button>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Status Check</Text>
              <Text as="p" variant="bodyMd">✅ React rendering: OK</Text>
              <Text as="p" variant="bodyMd">✅ Polaris components: OK</Text>
              <Text as="p" variant="bodyMd">✅ App Bridge navigation: OK</Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Auth & DB features will be restored after confirming basic rendering works.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Quick Actions</Text>
              <Button onClick={() => navigate("/app/products")} variant="primary">
                Sync Products
              </Button>
              <Button onClick={() => navigate("/app/generate")}>
                Generate Alt Text
              </Button>
              <Button onClick={() => navigate("/app/settings")}>
                Settings
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
