import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page, Layout, Card, Text, Grid, BlockStack, InlineStack,
  Badge, ProgressBar, Banner, Button, ButtonGroup, Box, EmptyState, List, Modal, Icon,
} from "@shopify/polaris";
import { CheckCircleIcon, AlertTriangleIcon } from "@shopify/polaris-icons";
import { useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { getOrCreateShop } from "~/utils/shop.server";
import { getDashboardStats } from "~/services/sync.server";
import { getCurrentUsage } from "~/services/billing.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const [stats, usage] = await Promise.all([
    getDashboardStats(shop.id),
    getCurrentUsage(shop.id),
  ]);

  const totalImages = stats.totalImages;
  const imagesWithoutAlt = totalImages - stats.imagesWithAlt;

  return {
    stats,
    usage,
    shopDomain: session.shop,
    planType: shop.planType,
    showOnboarding: stats.totalProducts === 0,
    onboardingStep: "welcome",
    needsReview: stats.imagesPending > 0,
    hasAiGenerated: stats.imagesWithAi > 0,
    imagesWithoutAlt,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  // All onboarding state is client-side for now (no DB)
  if (intent === "dismiss_onboarding" || intent === "advance_onboarding") {
    return json({ success: true });
  }

  return json({ success: false });
};

export default function DashboardIndex() {
  const {
    stats, usage, shopDomain, planType, showOnboarding, onboardingStep: initialStep,
    needsReview, hasAiGenerated, imagesWithoutAlt,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [onboardingOpen, setOnboardingOpen] = useState(showOnboarding);
  const [onboardingStep, setOnboardingStepState] = useState(initialStep || "welcome");

  const quotaWarning = usage.percentage >= 80;
  const quotaCritical = usage.percentage >= 95;
  const altTextCoverage = stats.totalImages > 0 ? Math.round((stats.imagesWithAlt / stats.totalImages) * 100) : 0;

  const dismissOnboarding = useCallback(() => {
    setOnboardingOpen(false);
  }, []);

  const advanceOnboarding = useCallback((step: string) => {
    setOnboardingStepState(step);
  }, []);

  const onboardingModal = (
    <Modal open={onboardingOpen} onClose={dismissOnboarding} title="" large titleHidden>
      <Modal.Section>
        {onboardingStep === "welcome" && (
          <BlockStack gap="400" align="center">
            <Box paddingBlockStart="400"><Icon source={CheckCircleIcon} tone="success" /></Box>
            <Text as="h2" variant="headingXl" alignment="center">Welcome to AltOptimizer! 🚀</Text>
            <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
              Supercharge your Shopify store's SEO with AI-powered product image optimization
            </Text>
            <BlockStack gap="300">
              <List type="bullet">
                <List.Item><Text as="span" fontWeight="semibold">AI Alt Text Generation</Text> — AI vision analyzes your product images and generates SEO-optimized alt text under 125 characters</List.Item>
                <List.Item><Text as="span" fontWeight="semibold">Smart Product Tags</Text> — Automatically generate relevant tags based on image content, product title, and description</List.Item>
                <List.Item><Text as="span" fontWeight="semibold">JSON-LD Structured Data</Text> — Boost search visibility with Schema.org Product markup for every item</List.Item>
              </List>
            </BlockStack>
            <InlineStack gap="200">
              <Button variant="primary" onClick={() => { advanceOnboarding("sync"); }}>Get Started →</Button>
              <Button onClick={dismissOnboarding}>Skip</Button>
            </InlineStack>
          </BlockStack>
        )}
        {onboardingStep === "sync" && (
          <BlockStack gap="400" align="center">
            <Box paddingBlockStart="400"><Icon source={CheckCircleIcon} tone="info" /></Box>
            <Text as="h2" variant="headingXl" alignment="center">Sync Your Products</Text>
            <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
              Import all products from your Shopify store to get started.
            </Text>
            <InlineStack gap="200">
              <Button variant="primary" onClick={() => { advanceOnboarding("generate"); navigate("/app/products"); }}>Sync Products Now</Button>
              <Button onClick={() => { advanceOnboarding("generate"); }}>Skip</Button>
            </InlineStack>
          </BlockStack>
        )}
        {onboardingStep === "generate" && (
          <BlockStack gap="400" align="center">
            <Box paddingBlockStart="400"><Icon source={CheckCircleIcon} tone="success" /></Box>
            <Text as="h2" variant="headingXl" alignment="center">Generate AI Alt Text</Text>
            <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
              One click is all it takes. Navigate to the Generate page to start.
            </Text>
            <InlineStack gap="200">
              <Button variant="primary" onClick={() => navigate("/app/generate")}>Go to Generate →</Button>
              <Button onClick={dismissOnboarding}>Done</Button>
            </InlineStack>
          </BlockStack>
        )}
      </Modal.Section>
    </Modal>
  );

  return (
    <Page title="Dashboard">
      {onboardingModal}

      <Layout>
        {/* Quota Warning */}
        {(quotaWarning || quotaCritical) && (
          <Layout.Section>
            <Banner tone={quotaCritical ? "critical" : "warning"}
              action={{ content: "Upgrade Plan", url: "/app/settings" }}>
              <Text as="p">You've used {usage.percentage}% of your monthly quota ({usage.imagesGenerated}/{usage.quota} images).{quotaCritical && " Upgrade to avoid interruptions."}</Text>
            </Banner>
          </Layout.Section>
        )}

        {/* Quick-Start for New Users */}
        {stats.totalProducts === 0 && !onboardingOpen && (
          <Layout.Section>
            <Banner title="Welcome to AltOptimizer!" tone="info">
              <BlockStack gap="200">
                <Text as="p">Get started in 3 simple steps:</Text>
                <List type="number">
                  <List.Item><Text as="span" fontWeight="semibold">Sync your products</Text> — Import all products from your Shopify store</List.Item>
                  <List.Item><Text as="span" fontWeight="semibold">Generate AI alt text</Text> — Let AI analyze your product images</List.Item>
                  <List.Item><Text as="span" fontWeight="semibold">Review & apply</Text> — Review suggestions and apply with one click</List.Item>
                </List>
                <InlineStack gap="200" wrap={false}>
                  <Button variant="primary" onClick={() => navigate("/app/products")}>Sync Products Now</Button>
                  <Button onClick={() => navigate("/app/generate")}>Generate Alt Text</Button>
                </InlineStack>
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}

        {/* Needs Review Banner */}
        {needsReview && stats.totalProducts > 0 && (
          <Layout.Section>
            <Banner title={`${stats.imagesPending} images pending review`} tone="info"
              action={{ content: "Review Now", url: "/app/review" }}>
              <Text as="p">AI-generated alt text is ready for your review.</Text>
            </Banner>
          </Layout.Section>
        )}

        {/* Stats Cards */}
        <Layout.Section>
          <Grid columns={{ xs: 1, sm: 2, md: 4, lg: 4, xl: 4 }}>
            <Grid.Cell>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Total Products</Text>
                  <Text as="h1" variant="heading2xl">{stats.totalProducts}</Text>
                  <Box minHeight="20px">
                    {stats.totalProducts > 0 && (
                      <Button variant="plain" size="slim" onClick={() => navigate("/app/products")}>View all</Button>
                    )}
                  </Box>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Total Images</Text>
                  <Text as="h1" variant="heading2xl">{stats.totalImages}</Text>
                  <Box minHeight="20px">
                    {imagesWithoutAlt > 0 ? (
                      <Text as="p" variant="bodySm" tone="critical">{imagesWithoutAlt} without alt text</Text>
                    ) : stats.totalImages > 0 ? (
                      <Text as="p" variant="bodySm" tone="success">All images have alt text</Text>
                    ) : null}
                  </Box>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Alt Text Coverage</Text>
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h1" variant="heading2xl">{stats.totalImages > 0 ? `${altTextCoverage}%` : "—"}</Text>
                    {stats.totalImages > 0 && (
                      <Badge tone={altTextCoverage >= 80 ? "success" : altTextCoverage >= 50 ? "warning" : "critical"}>
                        {altTextCoverage >= 80 ? "Good" : altTextCoverage >= 50 ? "Fair" : "Needs work"}
                      </Badge>
                    )}
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {stats.totalImages > 0 ? `${stats.imagesWithAlt} of ${stats.totalImages} images` : "No images synced yet"}
                  </Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">AI Generated</Text>
                  <Text as="h1" variant="heading2xl">{stats.imagesWithAi}</Text>
                  <Box minHeight="20px">
                    {stats.imagesPending > 0 ? (
                      <Text as="p" variant="bodySm" tone="info">{stats.imagesPending} pending review</Text>
                    ) : stats.imagesWithAi > 0 ? (
                      <Text as="p" variant="bodySm" tone="success">All reviewed</Text>
                    ) : (
                      <Text as="p" variant="bodySm" tone="subdued">No generations yet</Text>
                    )}
                  </Box>
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Layout.Section>

        {/* AI Usage & Quick Actions */}
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">AI Generation Usage</Text>
                <Badge>{usage.planName}</Badge>
              </InlineStack>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">Monthly Usage</Text>
                  <Badge tone={quotaCritical ? "critical" : quotaWarning ? "warning" : "success"}>{usage.imagesGenerated} / {usage.quota}</Badge>
                </InlineStack>
                <ProgressBar progress={Math.min(usage.percentage, 100) / 100} tone={quotaCritical ? "critical" : quotaWarning ? "warning" : "success"} />
                <Text as="p" variant="bodySm" tone="subdued">{usage.quota - usage.imagesGenerated} generations remaining this month</Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Quick Actions</Text>
              <ButtonGroup fullWidth>
                <Button onClick={() => navigate("/app/products")} variant="primary">Sync & View Products</Button>
                <Button onClick={() => navigate("/app/generate")}>Generate Alt Text</Button>
              </ButtonGroup>
              <ButtonGroup fullWidth>
                <Button onClick={() => navigate("/app/review")} disabled={!hasAiGenerated}>Review Suggestions</Button>
                <Button onClick={() => navigate("/app/backup")}>Backup Data</Button>
              </ButtonGroup>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Plan Info */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">Current Plan</Text>
                  <Text as="p" variant="bodySm" tone="subdued">{usage.planName} — {usage.quota} image generations per month</Text>
                </BlockStack>
                <Badge tone="info">{usage.planName}</Badge>
              </InlineStack>
              <Box padding="300" borderRadius="200" background="bg-surface-secondary">
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd">
                    AltOptimizer is free to install and includes {usage.quota} AI image generations every month.
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Generated alt text, tags, and structured data are applied directly to your products.
                  </Text>
                </BlockStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
