import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
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
  ButtonGroup,
  Box,
  EmptyState,
  List,
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

  const isNewUser = stats.totalProducts === 0;
  const needsReview = stats.imagesPending > 0;
  const hasAiGenerated = stats.imagesWithAi > 0;

  return {
    stats,
    usage,
    shopDomain: session.shop,
    planType: shop.planType,
    isNewUser,
    needsReview,
    hasAiGenerated,
    imagesWithoutAlt: stats.totalImages - stats.imagesWithAlt,
  };
};

export default function DashboardIndex() {
  const { stats, usage, shopDomain, planType, isNewUser, needsReview, hasAiGenerated, imagesWithoutAlt } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const quotaWarning = usage.percentage >= 80;
  const quotaCritical = usage.percentage >= 95;
  const altTextCoverage =
    stats.totalImages > 0 ? Math.round((stats.imagesWithAlt / stats.totalImages) * 100) : 0;

  return (
    <Page title="Dashboard" subtitle={`Connected to ${shopDomain}`}>
      <Layout>
        {/* Quota Warning Banner */}
        {quotaWarning && (
          <Layout.Section>
            <Banner
              title={
                quotaCritical
                  ? "Quota almost exhausted — upgrade to continue generating"
                  : `Approaching your ${usage.planName} plan limit`
              }
              tone={quotaCritical ? "critical" : "warning"}
              action={{
                content: "Upgrade Plan",
                url: "/app/settings",
              }}
            >
              <Text as="p">
                You've used {usage.percentage}% of your monthly quota ({usage.imagesGenerated}/{usage.quota} images).
                {quotaCritical && " Upgrade to avoid interruptions."}
              </Text>
            </Banner>
          </Layout.Section>
        )}

        {/* Quick-Start Guide for New Users */}
        {isNewUser && (
          <Layout.Section>
            <Banner
              title="Welcome to AltOptimizer!"
              tone="info"
            >
              <BlockStack gap="200">
                <Text as="p">Get started in 3 simple steps:</Text>
                <List type="number">
                  <List.Item>
                    <Text as="span" fontWeight="semibold">Sync your products</Text> — Import all products from your Shopify store
                  </List.Item>
                  <List.Item>
                    <Text as="span" fontWeight="semibold">Generate AI alt text</Text> — Let GPT-4o analyze your product images and suggest SEO-optimized alt text
                  </List.Item>
                  <List.Item>
                    <Text as="span" fontWeight="semibold">Review & apply</Text> — Review suggestions, edit if needed, and apply with one click
                  </List.Item>
                </List>
                <InlineStack gap="200" wrap={false}>
                  <Button variant="primary" onClick={() => navigate("/app/products")}>
                    Sync Products Now
                  </Button>
                  <Button onClick={() => navigate("/app/generate")}>
                    Generate Alt Text
                  </Button>
                </InlineStack>
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}

        {/* Needs Review Banner */}
        {needsReview && !isNewUser && (
          <Layout.Section>
            <Banner
              title={`${stats.imagesPending} images pending review`}
              tone="info"
              action={{
                content: "Review Now",
                url: "/app/review",
              }}
            >
              <Text as="p">
                AI-generated alt text is ready for your review. Review and apply to optimize your store's SEO.
              </Text>
            </Banner>
          </Layout.Section>
        )}

        {/* Stats Cards */}
        <Layout.Section>
          <Grid columns={{ xs: 1, sm: 2, md: 4, lg: 4, xl: 4 }}>
            <Grid.Cell>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Total Products
                  </Text>
                  <Text as="h1" variant="heading2xl">
                    {stats.totalProducts}
                  </Text>
                  <Box minHeight="20px">
                    {stats.totalProducts > 0 && (
                      <Button variant="plain" size="slim" onClick={() => navigate("/app/products")}>
                        View all
                      </Button>
                    )}
                  </Box>
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
                  <Box minHeight="20px">
                    {imagesWithoutAlt > 0 && (
                      <Text as="p" variant="bodySm" tone="critical">
                        {imagesWithoutAlt} without alt text
                      </Text>
                    )}
                  </Box>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Alt Text Coverage
                  </Text>
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h1" variant="heading2xl">
                      {altTextCoverage}%
                    </Text>
                    <Badge tone={altTextCoverage >= 80 ? "success" : altTextCoverage >= 50 ? "warning" : "critical"}>
                      {altTextCoverage >= 80 ? "Good" : altTextCoverage >= 50 ? "Fair" : "Needs work"}
                    </Badge>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {stats.imagesWithAlt} of {stats.totalImages} images have alt text
                  </Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    AI Generated
                  </Text>
                  <Text as="h1" variant="heading2xl">
                    {stats.imagesWithAi}
                  </Text>
                  <Box minHeight="20px">
                    {stats.imagesPending > 0 && (
                      <Text as="p" variant="bodySm" tone="info">
                        {stats.imagesPending} pending review
                      </Text>
                    )}
                  </Box>
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Layout.Section>

        {/* AI Generation Status */}
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  AI Generation Usage
                </Text>
                <Badge>{usage.planName}</Badge>
              </InlineStack>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">
                    Monthly Usage
                  </Text>
                  <Badge tone={quotaCritical ? "critical" : quotaWarning ? "warning" : "success"}>
                    {usage.imagesGenerated} / {usage.quota}
                  </Badge>
                </InlineStack>
                <ProgressBar
                  progress={Math.min(usage.percentage, 100) / 100}
                  tone={quotaCritical ? "critical" : quotaWarning ? "warning" : "success"}
                />
                <Text as="p" variant="bodySm" tone="subdued">
                  {usage.quota - usage.imagesGenerated} generations remaining this month
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
                  <Badge tone={stats.imagesPending > 0 ? "info" : "success"}>
                    {stats.imagesPending > 0 ? `${stats.imagesPending} pending` : "All reviewed"}
                  </Badge>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">
                    Alt Text Coverage
                  </Text>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    {altTextCoverage}%
                  </Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Quick Actions
              </Text>
              <BlockStack gap="200">
                <ButtonGroup fullWidth>
                  <Button onClick={() => navigate("/app/products")} variant="primary">
                    Sync & View Products
                  </Button>
                  <Button onClick={() => navigate("/app/generate")}>
                    Generate Alt Text
                  </Button>
                </ButtonGroup>
                <ButtonGroup fullWidth>
                  <Button onClick={() => navigate("/app/review")} disabled={!hasAiGenerated}>
                    Review Suggestions
                    {!hasAiGenerated && " (no suggestions yet)"}
                  </Button>
                  <Button onClick={() => navigate("/app/backup")}>
                    Backup Data
                  </Button>
                </ButtonGroup>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Plan & Upgrade */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    Current Plan
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {usage.planName} — {usage.quota} image generations per month
                  </Text>
                </BlockStack>
                <Badge tone="info">{usage.planName}</Badge>
              </InlineStack>

              {planType === "free" && (
                <Box
                  padding="300"
                  borderRadius="200"
                  background="bg-surface-secondary"
                >
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Upgrade to unlock more generations
                    </Text>
                    <List type="bullet">
                      <List.Item><Text as="span" fontWeight="semibold">Starter ($9/mo):</Text> 300 images/month — perfect for small shops</List.Item>
                      <List.Item><Text as="span" fontWeight="semibold">Professional ($19/mo):</Text> 1,000 images/month for growing stores</List.Item>
                      <List.Item><Text as="span" fontWeight="semibold">Business ($49/mo):</Text> 5,000 images/month for large catalogs</List.Item>
                    </List>
                    <Button variant="primary" onClick={() => navigate("/app/settings")}>
                      Upgrade Plan
                    </Button>
                  </BlockStack>
                </Box>
              )}

              {planType !== "free" && (
                <Box>
                  <Button variant="plain" onClick={() => navigate("/app/settings")}>
                    Manage Plan
                  </Button>
                </Box>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}