import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, useLoaderData, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Select,
  Badge,
  Banner,
  FormLayout,
  DataTable,
  ProgressBar,
  ChoiceList,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { getCurrentUsage, getUsageHistory } from "~/services/billing.server";
import { PLANS } from "~/constants";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }

  const [usage, history] = await Promise.all([
    getCurrentUsage(shop.id),
    getUsageHistory(shop.id, 30),
  ]);

  return {
    shopDomain: session.shop,
    planType: shop.planType,
    locale: shop.locale,
    usage,
    history,
    plans: Object.entries(PLANS).map(([key, plan]) => ({
      key,
      ...plan,
      isCurrent: key === shop.planType,
    })),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "update_plan") {
    const newPlan = formData.get("plan") as string;
    if (PLANS[newPlan]) {
      await prisma.shop.update({
        where: { id: shop.id },
        data: { planType: newPlan },
      });
      return json({ success: true, message: `Plan updated to ${PLANS[newPlan].name}.` });
    }
    return json({ success: false, error: "Invalid plan." });
  }

  if (intent === "update_locale") {
    const locale = formData.get("locale") as string;
    await prisma.shop.update({
      where: { id: shop.id },
      data: { locale },
    });
    return json({ success: true, message: "Language preference updated." });
  }

  return json({ success: false, error: "Unknown action" });
};

export default function SettingsPage() {
  const { shopDomain, planType, locale, usage, history, plans } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isProcessing = navigation.state !== "idle";

  const [selectedPlan, setSelectedPlan] = useState(planType);
  const [selectedLocale, setSelectedLocale] = useState(locale);

  const handleUpdatePlan = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "update_plan");
    formData.set("plan", selectedPlan);
    submit(formData, { method: "post" });
  }, [selectedPlan, submit]);

  const handleUpdateLocale = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "update_locale");
    formData.set("locale", selectedLocale);
    submit(formData, { method: "post" });
  }, [selectedLocale, submit]);

  const planRows = plans.map((plan) => [
    <InlineStack gap="200" key={plan.key} align="start">
      <Text as="p" fontWeight="semibold">{plan.name}</Text>
      {plan.isCurrent && <Badge tone="success">Current</Badge>}
    </InlineStack>,
    plan.price === 0 ? "Free" : `$${plan.price}/mo`,
    `${plan.monthlyQuota} images`,
    plan.description,
    !plan.isCurrent ? (
      <Button
        size="slim"
        variant={plan.key === selectedPlan ? "primary" : "plain"}
        onClick={() => setSelectedPlan(plan.key)}
      >
        {plan.key === selectedPlan ? "Selected" : "Select"}
      </Button>
    ) : (
      <Badge tone="info">Active</Badge>
    ),
  ]);

  const usageRows = history.slice(0, 14).map((h) => [
    h.date,
    String(h.imagesGenerated),
    String(h.apiCalls),
  ]);

  return (
    <Page title="Settings" subtitle="Manage your plan and preferences">
      <Layout>
        {actionData?.success && (
          <Layout.Section>
            <Banner title="Success" tone="success">
              <Text as="p">{actionData.message}</Text>
            </Banner>
          </Layout.Section>
        )}

        {actionData && !actionData.success && (
          <Layout.Section>
            <Banner title="Error" tone="critical">
              <Text as="p">{"error" in actionData ? actionData.error : "An error occurred."}</Text>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Subscription Plans
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Choose the plan that fits your store's needs.
              </Text>
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text"]}
                headings={["Plan", "Price", "Quota", "Description", "Action"]}
                rows={planRows}
              />
              {selectedPlan !== planType && (
                <Button
                  variant="primary"
                  onClick={handleUpdatePlan}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Updating..." : `Switch to ${PLANS[selectedPlan]?.name || selectedPlan}`}
                </Button>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Language Preference
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                AI-generated alt text will be created in this language.
              </Text>
              <FormLayout>
                <Select
                  label="Alt Text Language"
                  options={[
                    { label: "English", value: "en" },
                    { label: "Spanish", value: "es" },
                    { label: "French", value: "fr" },
                    { label: "German", value: "de" },
                    { label: "Portuguese", value: "pt" },
                    { label: "Japanese", value: "ja" },
                    { label: "Chinese", value: "zh" },
                    { label: "Korean", value: "ko" },
                    { label: "Italian", value: "it" },
                    { label: "Dutch", value: "nl" },
                  ]}
                  value={selectedLocale}
                  onChange={setSelectedLocale}
                />
                {selectedLocale !== locale && (
                  <Button
                    variant="primary"
                    onClick={handleUpdateLocale}
                    disabled={isProcessing}
                  >
                    Save Language
                  </Button>
                )}
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Current Usage
              </Text>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p">Plan</Text>
                  <Badge>{usage.planName}</Badge>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p">Images Generated</Text>
                  <Text as="p" fontWeight="semibold">
                    {usage.imagesGenerated} / {usage.quota}
                  </Text>
                </InlineStack>
                <ProgressBar progress={usage.percentage / 100} />
                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm" tone="subdued">
                    {usage.quota - usage.imagesGenerated} remaining
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {usage.percentage}% used
                  </Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Usage History (Last 14 Days)
              </Text>
              {usageRows.length === 0 ? (
                <Text as="p" tone="subdued">
                  No usage data yet. Start generating alt text to see your history.
                </Text>
              ) : (
                <DataTable
                  columnContentTypes={["text", "numeric", "numeric"]}
                  headings={["Date", "Images Generated", "API Calls"]}
                  rows={usageRows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Shop Information
              </Text>
              <InlineStack align="space-between">
                <Text as="p" tone="subdued">Shop Domain</Text>
                <Text as="p">{shopDomain}</Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="p" tone="subdued">App Version</Text>
                <Text as="p">1.0.0</Text>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
