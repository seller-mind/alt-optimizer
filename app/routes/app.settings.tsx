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
import { getCurrentUsage, getUsageHistory, deleteShopData } from "~/services/billing.server";
import { getOrCreateShop } from "~/utils/shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

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
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "update_locale") {
    const locale = formData.get("locale") as string;
    await prisma.shop.update({
      where: { id: shop.id },
      data: { locale },
    });
    return json({ success: true, message: "Language preference updated." });
  }

  if (intent === "delete_my_data") {
    await deleteShopData(shop.id);
    return json({ success: true, message: "All your data has been permanently deleted." });
  }

  return json({ success: false, error: "Unknown action" });
};

export default function SettingsPage() {
  const { shopDomain, planType, locale, usage, history } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isProcessing = navigation.state !== "idle";

  const [selectedLocale, setSelectedLocale] = useState(locale);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdateLocale = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "update_locale");
    formData.set("locale", selectedLocale);
    submit(formData, { method: "post" });
  }, [selectedLocale, submit]);

  const usageRows = history.slice(0, 14).map((h) => [
    h.date,
    String(h.imagesGenerated + h.tagsGenerated + h.jsonLdGenerated),
    String(h.imagesGenerated),
    String(h.tagsGenerated),
    String(h.jsonLdGenerated),
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
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">Plan</Text>
              <Text as="p" variant="bodyMd">
                AltOptimizer is free to install and includes {usage.quota} AI image generations every month.
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Your monthly usage resets automatically.
              </Text>
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
                  <Text as="p">Alt Text Generated</Text>
                  <Text as="p" fontWeight="semibold">{usage.imagesGenerated}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p">Tags Generated</Text>
                  <Text as="p" fontWeight="semibold">{usage.tagsGenerated}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p">JSON-LD Generated</Text>
                  <Text as="p" fontWeight="semibold">{usage.jsonLdGenerated}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p">Total Usage</Text>
                  <Text as="p" fontWeight="semibold">
                    {usage.imagesGenerated + usage.tagsGenerated + usage.jsonLdGenerated} / {usage.quota}
                  </Text>
                </InlineStack>
                <ProgressBar progress={usage.percentage / 100} />
                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm" tone="subdued">
                    {usage.remaining} remaining
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
                  columnContentTypes={["text", "numeric", "numeric", "numeric", "numeric", "numeric"]}
                  headings={["Date", "Total", "Alt Text", "Tags", "JSON-LD", "API Calls"]}
                  rows={usageRows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
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
                <Text as="p" tone="subdued">AI Provider</Text>
                <Badge tone="info">DeepSeek AI</Badge>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="p" tone="subdued">App Version</Text>
                <Text as="p">1.0.0</Text>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" wrap={false}>
                <Text as="h2" variant="headingMd" tone="critical">
                  GDPR & Data Deletion
                </Text>
                <Badge tone="critical">GDPR</Badge>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                AltOptimizer only stores product data, product images, and generated AI content.
                We do not collect customer data, order information, or personal data.
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                If you delete your data, all your products, images, alt text history, backups, and usage metrics will be permanently removed. This action cannot be undone.
              </Text>
              {!showDeleteConfirm ? (
                <Button
                  tone="critical"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete My Data
                </Button>
              ) : (
                <BlockStack gap="200">
                  <Banner tone="critical" title="Are you sure?">
                    <Text as="p">This will permanently delete all your store data from AltOptimizer. This cannot be undone.</Text>
                  </Banner>
                  <InlineStack gap="200">
                    <Button
                      tone="critical"
                      variant="primary"
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("intent", "delete_my_data");
                        submit(fd, { method: "post" });
                      }}
                    >
                      Yes, Delete Everything
                    </Button>
                    <Button onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                  </InlineStack>
                </BlockStack>
              )}
              <Text as="p" variant="bodyXs" tone="subdued">
                Data retention policy: After uninstalling, your data is kept for 30 days.
                You can request immediate deletion at any time.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
