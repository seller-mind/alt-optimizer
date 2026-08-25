import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, useLoaderData, useNavigate, useSubmit, useNavigation } from "@remix-run/react";
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
  Modal,
  Icon,
} from "@shopify/polaris";
import { CheckCircleIcon, AlertTriangleIcon } from "@shopify/polaris-icons";
import { authenticate } from "~/shopify.server";
import { getDashboardStats } from "~/services/sync.server";
import { getCurrentUsage } from "~/services/billing.server";
import prisma from "~/db.server";
import { useState, useCallback } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  // Auto-create shop record if missing (e.g., afterAuth did not create it)
  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        shopDomain: session.shop,
        accessToken: session.accessToken || "",
        planType: "free",
        status: "active",
      },
    });
    console.log(`[AltOptimizer] Auto-created missing shop record for: ${session.shop}`);
  }

  const [stats, usage] = await Promise.all([
    getDashboardStats(shop.id),
    getCurrentUsage(shop.id),
  ]);

  const isNewUser = stats.totalProducts === 0;
  const showOnboarding = isNewUser || shop.onboardingStep !== "completed";
  const needsReview = stats.imagesPending > 0;
  const hasAiGenerated = stats.imagesWithAi > 0;

  return {
    stats,
    usage,
    shopDomain: session.shop,
    planType: shop.planType,
    showOnboarding,
    onboardingStep: shop.onboardingStep || "welcome",
    needsReview,
    hasAiGenerated,
    imagesWithoutAlt: stats.totalImages - stats.imagesWithAlt,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "dismiss_onboarding") {
    await prisma.shop.update({
      where: { shopDomain: session.shop },
      data: { onboardingStep: "completed" },
    });
    return json({ success: true });
  }

  if (intent === "advance_onboarding") {
    const step = String(formData.get("step") || "welcome");
    await prisma.shop.update({
      where: { shopDomain: session.shop },
      data: { onboardingStep: step },
    });
    return json({ success: true });
  }

  return json({ success: false });
};

export default function DashboardIndex() {
  const {
    stats, usage, shopDomain, planType, showOnboarding, onboardingStep,
    needsReview, hasAiGenerated, imagesWithoutAlt,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [onboardingOpen, setOnboardingOpen] = useState(showOnboarding);

  const quotaWarning = usage.percentage >= 80;
  const quotaCritical = usage.percentage >= 95;
  const altTextCoverage =
    stats.totalImages > 0 ? Math.round((stats.imagesWithAlt / stats.totalImages) * 100) : 0;

  const dismissOnboarding = useCallback(() => {
    setOnboardingOpen(false);
    const formData = new FormData();
    formData.set("intent", "dismiss_onboarding");
    submit(formData, { method: "post" });
  }, [submit]);

  const advanceOnboarding = useCallback((step: string) => {
    const formData = new FormData();
    formData.set("intent", "advance_onboarding");
    formData.set("step", step);
    submit(formData, { method: "post" });
  }, [submit]);

  const onboardingModal = (
    <Modal
      open={onboardingOpen}
      onClose={dismissOnboarding}
      title=""
      large
      titleHidden
    >
      <Modal.Section>
        {onboardingStep === "welcome" && (
          <BlockStack gap="400" align="center">
            <Box paddingBlockStart="400">
              <Icon source={CheckCircleIcon} tone="success" />
            </Box>
            <Text as="h2" variant="headingXl" alignment="center">
              Welcome to AltOptimizer! 🚀
            </Text>
            <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
              Supercharge your Shopify store's SEO with AI-powered product image optimization
            </Text>
            <BlockStack gap="300">
              <List type="bullet">
                <List.Item>
                  <Text as="span" fontWeight="semibold">AI Alt Text Generation</Text> — GPT-4o analyzes your product images and generates SEO-optimized alt text under 125 characters
                </List.Item>
                <List.Item>
                  <Text as="span" fontWeight="semibold">Smart Product Tags</Text> — Automatically generate relevant tags based on image content, product title, and description
                </List.Item>
                <List.Item>
                  <Text as="span" fontWeight="semibold">JSON-LD Structured Data</Text> — Boost search visibility with Schema.org Product markup for every item
                </List.Item>
              </List>
            </BlockStack>
            <InlineStack gap="200">
              <Button variant="primary" onClick={() => { advanceOnboarding("sync"); }}>
                Get Started →
              </Button>
              <Button onClick={dismissOnboarding}>Skip</Button>
            </InlineStack>
          </BlockStack>
        )}

        {onboardingStep === "sync" && (
          <BlockStack gap="400" align="center">
            <Box paddingBlockStart="400">
              <Icon source={CheckCircleIcon} tone="info" />
            </Box>
            <Text as="h2" variant="headingXl" alignment="center">
              Sync Your Products
            </Text>
            <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
              Import all products from your Shopify store to get started. We'll pull in product images, titles, and descriptions.
            </Text>
            <Box padding="400" borderRadius="200" background="bg-surface-secondary" width="100%">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" fontWeight="semibold">What gets synced:</Text>
                <List type="bullet">
                  <List.Item>All product images with existing alt text</List.Item>
                  <List.Item>Product titles, handles, and descriptions</List.Item>
                  <List.Item>Vendor, price, SKU, and currency information</List.Item>
                </List>
              </BlockStack>
            </Box>
            <InlineStack gap="200">
              <Button variant="primary" onClick={() => { advanceOnboarding("generate"); navigate("/app/products"); }}>
                Sync Products Now
              </Button>
              <Button onClick={() => { advanceOnboarding("generate"); }}>Skip, I'll do it later</Button>
            </InlineStack>
          </BlockStack>
        )}

        {onboardingStep === "generate" && (
          <BlockStack gap="400" align="center">
            <Box paddingBlockStart="400">
              <Icon source={CheckCircleIcon} tone="success" />
            </Box>
            <Text as="h2" variant="headingXl" alignment="center">
              Generate AI Alt Text
            </Text>
            <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
              One click is all it takes. GPT-4o analyzes each product image and generates SEO-optimized alt text, relevant tags, and JSON-LD structured data.
            </Text>
            <Box padding="400" borderRadius="200" background="bg-surface-secondary" width="100%">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" fontWeight="semibold">What you'll get:</Text>
                <List type="bullet">
                  <List.Item>SEO-optimized alt text (under 125 characters)</List.Item>
                  <List.Item>Relevant product tags for discoverability</List.Item>
                  <List.Item>JSON-LD structured data for rich snippets</List.Item>
                </List>
              </BlockStack>
            </Box>
            <InlineStack gap="200">
              <Button variant="primary" onClick={() => { dismissOnboarding(); navigate("/app/generate"); }}>
                Generate Alt Text
              </Button>
              <Button onClick={dismissOnboarding}>Done — take me to dashboard</Button>
            </InlineStack>
          </BlockStack>
        )}
      </Modal.Section>
    </Modal>
  );

  return (
    <Page title="Dashboard" subtitle={`Connected to ${shopDomain}`}>
      {onboardingModal}

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

        {/* Quick-Start Guide for New Users (non-modal) */}
        {stats.totalProducts === 0 && !onboardingOpen && (
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
        {needsReview && stats.totalProducts > 0 && (
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
                    {imagesWithoutAlt > 0 ? (
                      <Text as="p" variant="bodySm" tone="critical">
                        {imagesWithoutAlt} without alt text
                      </Text>
                    ) : stats.totalImages > 0 ? (
                      <Text as="p" variant="bodySm" tone="success">
                        All images have alt text
                      </Text>
                    ) : null}
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
                      {stats.totalImages > 0 ? `${altTextCoverage}%` : "—"}
                    </Text>
                    {stats.totalImages > 0 && (
                      <Badge tone={altTextCoverage >= 80 ? "success" : altTextCoverage >= 50 ? "warning" : "critical"}>
                        {altTextCoverage >= 80 ? "Good" : altTextCoverage >= 50 ? "Fair" : "Needs work"}
                      </Badge>
                    )}
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {stats.totalImages > 0
                      ? `${stats.imagesWithAlt} of ${stats.totalImages} images have alt text`
                      : "No images synced yet"}
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
                    {stats.imagesPending > 0 ? (
                      <Text as="p" variant="bodySm" tone="info">
                        {stats.imagesPending} pending review
                      </Text>
                    ) : stats.imagesWithAi > 0 ? (
                      <Text as="p" variant="bodySm" tone="success">
                        All reviewed
                      </Text>
                    ) : (
                      <Text as="p" variant="bodySm" tone="subdued">
                        No generations yet
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
                    {stats.totalImages > 0 ? `${altTextCoverage}%` : "—"}
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
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}