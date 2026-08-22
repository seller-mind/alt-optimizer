import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Grid,
  BlockStack,
  InlineStack,
  Badge,
  ProgressBar,
  Banner,
  Button,
  Box,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { getDashboardStats } from "~/services/sync.server";
import { getCurrentUsage } from "~/services/billing.server";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }

  const [stats, usage] = await Promise.all([
    getDashboardStats(shop.id),
    getCurrentUsage(shop.id),
  ]);

  return {
    stats,
    usage,
    shopDomain: session.shop,
    planType: shop.planType,
  };
};

export default function DashboardIndex() {
  const { stats, usage, shopDomain, planType } = useLoaderData<typeof loader>();

  const quotaWarning = usage.percentage >= 80;
  const quotaCritical = usage.percentage >= 95;

  return (
    <Page title="Dashboard" subtitle={`Connected to ${shopDomain}`}>
      <Layout>
        {quotaWarning && (
          <Layout.Section>
            <Banner
              title={
                quotaCritical
                  ? "Quota almost exhausted"
                  : "Approaching monthly quota limit"
              }
              tone={quotaCritical ? "critical" : "warning"}
            >
              <Text as="p">
                You have used {usage.percentage}% of your {usage.planName} plan
                quota ({usage.imagesGenerated}/{usage.quota} images).
                {quotaCritical && " Consider upgrading your plan."}
              </Text>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Grid columns={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3 }}>
            <Grid.Cell>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Total Products
                  </Text>
                  <Text as="h1" variant="heading2xl">
                    {stats.totalProducts}
                  </Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Total Images
                  </Text>
                  <Text as="h1" variant="heading2xl">
                    {stats.totalImages}
                  </Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Images with Alt Text
                  </Text>
                  <Text as="h1" variant="heading2xl">
                    {stats.imagesWithAlt}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {stats.totalImages > 0
                      ? Math.round((stats.imagesWithAlt / stats.totalImages) * 100)
                      : 0}
                    % coverage
                  </Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                AI Generation Status
              </Text>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">
                    Images Generated (This Month)
                  </Text>
                  <Badge tone={quotaCritical ? "critical" : quotaWarning ? "warning" : "success"}>
                    {usage.imagesGenerated} / {usage.quota}
                  </Badge>
                </InlineStack>
                <ProgressBar progress={usage.percentage / 100} />
                <Text as="p" variant="bodySm" tone="subdued">
                  {usage.quota - usage.imagesGenerated} remaining
                </Text>
              </BlockStack>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">
                    AI-Generated Alt Texts
                  </Text>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    {stats.imagesWithAi}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">
                    Pending Review
                  </Text>
                  <Badge tone="info">{stats.imagesPending}</Badge>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Quick Actions
              </Text>
              <BlockStack gap="200">
                <Button url="/app/products" variant="primary">
                  View Products
                </Button>
                <Button url="/app/generate">Generate Alt Text</Button>
                <Button url="/app/review">Review Suggestions</Button>
                <Button url="/app/backup">Backup Data</Button>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Current Plan
                </Text>
                <Badge tone="info">{usage.planName}</Badge>
              </InlineStack>
              <Text as="p" variant="bodyMd">
                {planType === "free"
                  ? "You are on the Free plan. Upgrade to generate more alt texts and unlock advanced features."
                  : `You are on the ${usage.planName} plan with ${usage.quota} image generations per month.`}
              </Text>
              <Box>
                <Button url="/app/settings" variant="plain">
                  Manage Plan
                </Button>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
