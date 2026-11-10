import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useSubmit, useNavigation } from "@remix-run/react";
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
  Box,
  Divider,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import { BILLING_PLANS, BILLING_PLAN_KEYS, type BillingPlanKey } from "~/billing-plans";
import prisma from "~/db.server";
import { getCurrentUsage, getUsageHistory, deleteShopData } from "~/services/billing.server";
import { getOrCreateShop } from "~/utils/shop.server";
import { PLANS } from "~/constants";

/**
 * Maps a Shopify billing plan key (the key in BILLING_PLANS) to our internal
 * planType (the key in PLANS / the value stored on Shop.planType).
 * Must stay in sync with `planMap` in app/routes/webhooks.tsx.
 */
const PLAN_KEY_TO_TYPE: Record<BillingPlanKey, string> = {
  Starter: "starter",
  Professional: "professional",
  Business: "business",
};

/**
 * Partner development stores cannot be charged with a real charge — Shopify
 * rejects non-test charges on them. Read the flag straight from the shop so the
 * test/live decision is never guessed from an environment variable.
 */
async function isPartnerDevelopmentStore(admin: any): Promise<boolean> {
  try {
    const response = await admin.graphql(`#graphql
      query ShopDevFlag {
        shop {
          plan {
            partnerDevelopment
          }
        }
      }
    `);
    const body = await response.json();
    return body?.data?.shop?.plan?.partnerDevelopment === true;
  } catch (error: any) {
    console.warn(`[Settings] Could not read partnerDevelopment flag: ${error?.message}`);
    return false;
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing, admin } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const isTest = await isPartnerDevelopmentStore(admin);

  // A failed billing lookup must never take the settings page down — the rest
  // of the page (usage, language, data deletion) is still fully usable.
  let hasActivePayment = false;
  let activeSubscriptions: Array<{ id: string; name: string }> = [];
  try {
    const check = await billing.check({ plans: BILLING_PLAN_KEYS, isTest });
    hasActivePayment = check.hasActivePayment;
    activeSubscriptions = (check.appSubscriptions || []).map((sub) => ({
      id: sub.id,
      name: sub.name,
    }));
  } catch (error: any) {
    console.warn(`[Settings] billing.check failed for ${session.shop}: ${error?.message}`);
  }

  // Reconcile: the APP_SUBSCRIPTIONS_UPDATE webhook is asynchronous, so right
  // after a merchant approves a charge they land back here with planType still
  // "free". Trusting the live Shopify state here makes the page correct even if
  // a webhook delivery is delayed or lost. The webhook stays the primary path.
  let effectivePlanType = shop.planType;
  if (hasActivePayment && activeSubscriptions.length > 0) {
    const activeName = activeSubscriptions[0].name as BillingPlanKey;
    const mappedType = PLAN_KEY_TO_TYPE[activeName];
    if (mappedType && mappedType !== shop.planType) {
      try {
        await prisma.shop.update({
          where: { id: shop.id },
          data: { planType: mappedType, chargeId: activeSubscriptions[0].id },
        });
        effectivePlanType = mappedType;
        console.log(
          `[Settings] Reconciled plan for ${session.shop}: ${shop.planType} -> ${mappedType}`
        );
      } catch (error: any) {
        console.warn(`[Settings] Plan reconcile failed for ${session.shop}: ${error?.message}`);
      }
    }
  }

  const [usage, history] = await Promise.all([
    getCurrentUsage(shop.id),
    getUsageHistory(shop.id, 30),
  ]);

  return {
    shopDomain: session.shop,
    planType: effectivePlanType,
    locale: shop.locale,
    usage,
    history,
    isTest,
    hasActivePayment,
    activeSubscriptions,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // Subscribe must run before anything that assumes an existing shop row,
  // because billing.request throws a redirect and never returns.
  if (intent === "subscribe") {
    const plan = formData.get("plan") as BillingPlanKey;

    if (!BILLING_PLAN_KEYS.includes(plan)) {
      return json({ success: false, error: "Unknown plan." }, { status: 400 });
    }

    const { session, billing, admin } = await authenticate.admin(request);
    const isTest = await isPartnerDevelopmentStore(admin);
    const storeHandle = session.shop.replace(/\.myshopify\.com$/, "");
    const returnUrl = `https://admin.shopify.com/store/${storeHandle}/apps/${process.env.SHOPIFY_API_KEY}/app/settings`;

    // Throws a redirect to Shopify's confirmation page. Remix handles it.
    return await billing.request({ plan, isTest, returnUrl });
  }

  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

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
  const {
    shopDomain,
    planType,
    locale,
    usage,
    history,
    isTest,
    hasActivePayment,
    activeSubscriptions,
  } = useLoaderData<typeof loader>();
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

  const handleSubscribe = useCallback(
    (plan: BillingPlanKey) => {
      const formData = new FormData();
      formData.set("intent", "subscribe");
      formData.set("plan", plan);
      submit(formData, { method: "post" });
    },
    [submit]
  );

  const usageRows = history.slice(0, 14).map((h) => [
    h.date,
    String(h.imagesGenerated + h.tagsGenerated + h.jsonLdGenerated),
    String(h.imagesGenerated),
    String(h.tagsGenerated),
    String(h.jsonLdGenerated),
    String(h.apiCalls),
  ]);

  const successMessage =
    actionData && "success" in actionData && actionData.success
      ? (actionData as { message?: string }).message
      : null;
  const errorMessage =
    actionData && "success" in actionData && !actionData.success && "error" in actionData
      ? (actionData as { error: string }).error
      : null;

  return (
    <Page title="Settings" subtitle="Manage your plan and preferences">
      <Layout>
        {successMessage && (
          <Layout.Section>
            <Banner title="Success" tone="success">
              <Text as="p">{successMessage}</Text>
            </Banner>
          </Layout.Section>
        )}

        {errorMessage && (
          <Layout.Section>
            <Banner title="Error" tone="critical">
              <Text as="p">{errorMessage}</Text>
            </Banner>
          </Layout.Section>
        )}

        {isTest && (
          <Layout.Section>
            <Banner tone="info" title="Test mode">
              <Text as="p">
                This is a development store, so plan changes use test charges and no card is
                charged.
              </Text>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Plan
                </Text>
                <Badge tone={planType === "free" ? undefined : "success"}>{usage.planName}</Badge>
              </InlineStack>

              <Text as="p" variant="bodyMd">
                {planType === "free"
                  ? `You are on the Free plan — ${usage.quota} AI image generations every month.`
                  : `${usage.planName} — ${usage.quota} AI image generations every month.`}
              </Text>

              {hasActivePayment && activeSubscriptions.length > 0 && (
                <Text as="p" variant="bodySm" tone="subdued">
                  Active subscription: {activeSubscriptions.map((s) => s.name).join(", ")}
                </Text>
              )}

              <Divider />

              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">
                  {planType === "free" ? "Upgrade" : "Change plan"}
                </Text>

                {BILLING_PLAN_KEYS.map((key) => {
                  const internalType = PLAN_KEY_TO_TYPE[key];
                  const config = PLANS[internalType];
                  const isCurrent = planType === internalType;
                  const amount = BILLING_PLANS[key].lineItems[0].amount;

                  return (
                    <Box
                      key={key}
                      padding="300"
                      borderWidth="025"
                      borderColor={isCurrent ? "border-emphasis" : "border"}
                      borderRadius="200"
                    >
                      <InlineStack align="space-between" blockAlign="center" wrap={false}>
                        <BlockStack gap="100">
                          <InlineStack gap="200" blockAlign="center">
                            <Text as="p" fontWeight="semibold">
                              {config.name}
                            </Text>
                            {isCurrent && <Badge tone="success">Current plan</Badge>}
                          </InlineStack>
                          <Text as="p" variant="bodySm" tone="subdued">
                            ${amount} / month · {config.monthlyQuota.toLocaleString()} images
                          </Text>
                        </BlockStack>

                        <Button
                          variant={isCurrent ? "secondary" : "primary"}
                          disabled={isCurrent || isProcessing}
                          onClick={() => handleSubscribe(key)}
                        >
                          {isCurrent ? "Current plan" : "Choose"}
                        </Button>
                      </InlineStack>
                    </Box>
                  );
                })}

                <Text as="p" variant="bodyXs" tone="subdued">
                  Plan changes are billed through Shopify and appear on your regular Shopify
                  invoice. Downgrading to Free is done from Shopify admin → Apps → AltOptimizer.
                </Text>
              </BlockStack>
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
                <Badge tone="info">AI Engine</Badge>
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
