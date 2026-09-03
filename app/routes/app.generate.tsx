import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, useLoaderData, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page, Layout, Card, Text, Button, BlockStack, InlineStack,
  Select, Banner, ProgressBar, Badge, Thumbnail, IndexTable,
  useIndexResourceState, FormLayout, ChoiceList, List, Modal,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { analyzeImage, generateTags, generateJsonLd } from "~/services/openai.server";
import { updateImageAltText, updateProductTags, writeProductJsonLd, injectJsonLdToTheme } from "~/services/shopify.server";
import { checkQuota, enforceQuota, incrementUsage, QuotaExceededError } from "~/services/billing.server";
import { getOrCreateShop } from "~/utils/shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const quota = await checkQuota(shop.id);

  const products = await prisma.product.findMany({
    where: {
      shopId: shop.id,
      images: {
        some: {
          OR: [
            { altTextOriginal: null },
            { status: "pending" },
          ],
        },
      },
    },
    include: {
      images: {
        where: {
          OR: [
            { altTextOriginal: null },
            { status: "pending" },
          ],
        },
      },
    },
    orderBy: { title: "asc" },
    take: 50,
  });

  return {
    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      images: p.images.map((img) => ({
        id: img.id,
        src: img.src,
        altTextOriginal: img.altTextOriginal,
        shopifyImageId: img.shopifyImageId,
      })),
    })),
    quota,
    shopLocale: shop.locale,
    planType: shop.planType,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // Enforce quota before any generation
  try {
    if (intent === "generate_alt") await enforceQuota(shop.id, "images");
    else if (intent === "generate_tags") await enforceQuota(shop.id, "tags");
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return json({
        success: false,
        quotaExceeded: true,
        error: `Monthly quota exceeded. You've used ${err.usage} of ${err.quota} on the ${err.planName} plan.`,
        planName: err.planName,
        quota: err.quota,
        usage: err.usage,
      });
    }
    throw err;
  }

  if (intent === "generate_alt") {
    const imageIds = formData.getAll("imageIds") as string[];
    const autoApply = formData.get("autoApply") === "true";

    const results: Array<{
      imageId: number;
      imageSrc?: string;
      productTitle?: string;
      altText: string;
      success: boolean;
      error?: string;
    }> = [];

    const imageIdsArray = imageIds.map((id) => parseInt(id, 10));
    const CONCURRENCY = 3;

    const processImage = async (imageId: number) => {
      const image = await prisma.productImage.findUnique({
        where: { id: imageId },
        include: { product: true },
      });

      if (!image) return null;

      try {
        // Pass image URL directly to AI service (avoid base64 overhead and size limits)
        const analysis = await analyzeImage(
          image.src,
          "",
          image.product.title,
          shop.locale
        );

        if (!analysis.altText || analysis.altText.trim().length === 0) {
          throw new Error("AI returned empty alt text");
        }

        await prisma.productImage.update({
          where: { id: imageId },
          data: {
            altTextAi: analysis.altText,
            status: autoApply ? "applied" : "pending",
          },
        });

        if (autoApply) {
          await updateImageAltText(admin, image.product.shopifyProductId, image.shopifyImageId, analysis.altText);
        }

        await prisma.altTextHistory.create({
          data: {
            imageId,
            altText: analysis.altText,
            source: "ai",
          },
        });

        return {
          imageId,
          imageSrc: image.src,
          productTitle: image.product.title,
          altText: analysis.altText,
          success: true as const,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        const status = (err as any)?.status ?? null;
        let friendlyError = "An unexpected error occurred. Please try again.";
        if (status === 429 || message.includes("429") || message.toLowerCase().includes("rate limit")) {
          friendlyError = `AI service rate limit hit (status ${status || "?"}). Please wait 1-2 minutes and try again.`;
        } else if (status === 401 || message.includes("401") || message.includes("API key")) {
          friendlyError = `AI service authentication failed. Please contact support.`;
        } else if (status === 413 || message.includes("too large") || message.includes("413")) {
          friendlyError = "Image too large for AI API. Try a smaller image.";
        } else if (message.includes("timeout") || message.includes("timed out")) {
          friendlyError = "Request timed out. The image may be too large or network is slow.";
        } else if (status === 400 || message.includes("400") || message.includes("invalid")) {
          friendlyError = "Invalid request. Please check the image and try again.";
        } else {
          friendlyError = "AI service error. Please try again later.";
        }

        return {
          imageId,
          altText: "",
          success: false as const,
          error: friendlyError,
        };
      }
    };

    // Process images in batches of CONCURRENCY
    for (let i = 0; i < imageIdsArray.length; i += CONCURRENCY) {
      const batch = imageIdsArray.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map((imageId) => processImage(imageId)));
      results.push(...batchResults.filter((r): r is NonNullable<typeof r> => r !== null));
    }

    const successCount = results.filter((r) => r.success).length;
    const failedResults = results.filter((r) => !r.success);

    if (successCount > 0) {
      await incrementUsage(shop.id, "images", successCount);
    }

    return json({
      success: successCount > 0,
      generated: successCount,
      total: imageIds.length,
      results,
      error: successCount === 0 && failedResults.length > 0
        ? failedResults.map((r) => r.error).filter(Boolean).join("; ")
        : undefined,
    });
  }

  if (intent === "generate_tags") {
    const productIds = formData.getAll("productIds") as string[];

    const results: Array<{
      productId: number;
      productTitle?: string;
      tags: string[];
      success: boolean;
      error?: string;
    }> = [];

    for (const productIdStr of productIds) {
      const productId = parseInt(productIdStr, 10);
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { images: true },
      });

      if (!product || product.images.length === 0) continue;

      try {
        const firstImage = product.images[0];
        // Pass image URL directly to AI service
        const tagResult = await generateTags(
          firstImage.src,
          "",
          product.title,
          product.description,
          shop.locale
        );

        await prisma.productImage.updateMany({
          where: { productId },
          data: { tagsAi: tagResult.tags.join(", ") },
        });

        results.push({
          productId,
          productTitle: product.title,
          tags: tagResult.tags,
          success: true,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({
          productId,
          productTitle: product.title,
          tags: [],
          success: false,
          error: message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    if (successCount > 0) {
      await incrementUsage(shop.id, "tags", successCount);
    }

    return json({
      success: true,
      results,
    });
  }

  if (intent === "generate_jsonld") {
    const productIds = formData.getAll("productIds") as string[];
    let successCount = 0;

    for (const productIdStr of productIds) {
      const productId = parseInt(productIdStr, 10);
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { images: true },
      });

      if (!product) continue;

      try {
        const jsonLd = await generateJsonLd(
          {
            title: product.title,
            description: product.description,
            handle: product.handle,
            images: product.images.map((img) => ({
              src: img.src,
              altText: img.altTextOriginal || undefined,
            })),
          },
          shop.shopDomain
        );

        await prisma.product.update({
          where: { id: productId },
          data: {
            jsonLdData: jsonLd,
            hasJsonLd: true,
          },
        });

        // Write JSON-LD to Shopify product metafield for storefront injection
        try {
          await writeProductJsonLd(admin, product.shopifyProductId, jsonLd);
        } catch (metaErr) {
          console.warn(`[AltOptimizer] Failed to write JSON-LD metafield for product ${productId}:`, metaErr);
        }

        successCount++;
      } catch {
        // Continue with next product
      }
    }

    if (successCount > 0) {
      await incrementUsage(shop.id, "jsonld", successCount);
      // Inject JSON-LD snippet into theme (idempotent, first time only)
      try {
        await injectJsonLdToTheme(admin);
      } catch (themeErr) {
        console.warn("[AltOptimizer] Theme injection skipped:", themeErr);
      }
    }

    return json({ success: true, generated: successCount });
  }

  return json({ success: false, error: "Unknown action" });
};

export default function GeneratePage() {
  const { products, quota, shopLocale, planType } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isGenerating = navigation.state !== "idle";

  const [generationType, setGenerationType] = useState<string>("alt_text");
  const [autoApply, setAutoApply] = useState<string>("false");
  const [showQuotaInfoModal, setShowQuotaInfoModal] = useState(false);

  const allImageIds = products.flatMap((p) => p.images.map((img) => String(img.id)));
  const selectedResources = useIndexResourceState(products);

  // Show quota info modal when quota exceeded
  const showQuotaModal = actionData && !actionData.success && (actionData as any).quotaExceeded;

  const handleGenerate = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", generationType === "alt_text" ? "generate_alt" : generationType === "tags" ? "generate_tags" : "generate_jsonld");
    formData.set("autoApply", autoApply);

    if (generationType === "alt_text") {
      const selectedImageIds = selectedResources.selectedResources.length > 0
        ? products
            .filter((p) => selectedResources.selectedResources.includes(String(p.id)))
            .flatMap((p) => p.images.map((img) => String(img.id)))
        : allImageIds;

      if (selectedImageIds.length === 0) return;
      selectedImageIds.forEach((id) => formData.append("imageIds", id));
    } else {
      const selectedProductIds = selectedResources.selectedResources.length > 0
        ? selectedResources.selectedResources
        : products.map((p) => String(p.id));

      if (selectedProductIds.length === 0) return;
      selectedProductIds.forEach((id) => formData.append("productIds", id));
    }

    submit(formData, { method: "post" });
  }, [generationType, autoApply, selectedResources.selectedResources, products, allImageIds, submit]);

  return (
    <Page title="AI Generation" subtitle="Generate alt text, tags, and structured data">
      {/* Quota Info Modal */}
      <Modal
        open={showQuotaModal || showQuotaInfoModal}
        onClose={() => { setShowQuotaInfoModal(false); }}
        title="Monthly Quota"
        primaryAction={{
          content: "Got it",
          onAction: () => setShowQuotaInfoModal(false),
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {showQuotaModal ? (
              <Banner tone="warning" title="Monthly quota exceeded">
                <Text as="p">
                  {(actionData as any)?.error}
                </Text>
              </Banner>
            ) : null}
            <Text as="p" variant="bodyMd">
              AltOptimizer is a free app that includes {quota.quota} AI generations per month.
              Your usage resets automatically at the start of each calendar month.
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              You have used {quota.percentage}% of your monthly quota.
              {quota.remaining} generations remaining this month.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Layout>
        {/* Quota Warning Banner */}
        {quota.warning && (
          <Layout.Section>
            <Banner
              title={quota.warning95 ? "Quota nearly exhausted" : "Quota warning"}
              tone={quota.warning95 ? "critical" : "warning"}
              action={{
                content: "View details",
                onAction: () => setShowQuotaInfoModal(true),
              }}
            >
              <Text as="p">
                You have used {quota.percentage}% of your monthly quota ({quota.remaining} remaining).
                {quota.warning95 && " Your quota resets at the start of each month."}
              </Text>
            </Banner>
          </Layout.Section>
        )}

        {/* Success Banner */}
        {actionData && actionData.success && (
          <Layout.Section>
            <Banner title="Generation complete" tone="success" onDismiss={() => {}}>
              <BlockStack gap="200">
                <Text as="p">
                  {"generated" in actionData
                    ? `Successfully generated ${actionData.generated} of ${actionData.total} alt texts.`
                    : "Operation completed successfully."}
                </Text>
                {"results" in actionData && actionData.results && (
                  <>
                    {actionData.results.filter((r: any) => !r.success).length > 0 && (
                      <Text as="p" tone="critical">
                        {actionData.results.filter((r: any) => !r.success).length} failed. See details below.
                      </Text>
                    )}
                  </>
                )}
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}

        {/* Error Banner */}
        {actionData && !actionData.success && !(actionData as any).quotaExceeded && (
          <Layout.Section>
            <Banner title="Error" tone="critical">
              <Text as="p">{"error" in actionData ? actionData.error : "An error occurred."}</Text>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" wrap={false}>
                <Text as="h2" variant="headingMd">Generation Settings</Text>
                <Badge tone={quota.remaining > 0 ? "success" : "critical"}>
                  {quota.remaining} quota remaining
                </Badge>
              </InlineStack>

              <FormLayout>
                <Select
                  label="Generation Type"
                  options={[
                    { label: "Alt Text (Image descriptions)", value: "alt_text" },
                    { label: "Product Tags", value: "tags" },
                    { label: "JSON-LD Structured Data", value: "jsonld" },
                  ]}
                  value={generationType}
                  onChange={setGenerationType}
                />

                {generationType === "alt_text" && (
                  <ChoiceList
                    title="Auto-apply to Shopify"
                    choices={[
                      { label: "Yes, apply immediately to store", value: "true" },
                      { label: "No, save for review first", value: "false" },
                    ]}
                    selected={[autoApply]}
                    onChange={([value]) => setAutoApply(value)}
                  />
                )}

                <InlineStack gap="200" align="space-between">
                  <Text as="p" variant="bodySm" tone="subdued">
                    {products.length} products eligible for generation
                  </Text>
                  <Button
                    variant="primary"
                    onClick={handleGenerate}
                    disabled={isGenerating || products.length === 0 || quota.remaining <= 0}
                    loading={isGenerating}
                  >
                    {isGenerating ? "Generating..." : `Generate ${generationType === "alt_text" ? "Alt Text" : generationType === "tags" ? "Tags" : "JSON-LD"}`}
                  </Button>
                </InlineStack>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Eligible Products</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Select specific products or leave all selected to generate for all eligible items.
              </Text>

              {products.length === 0 ? (
                <Text as="p" alignment="center">
                  All products have alt text. No generation needed.
                </Text>
              ) : (
                <>
                  <IndexTable
                    resourceName={{ singular: "product", plural: "products" }}
                    itemCount={products.length}
                    selectedItemsCount={selectedResources.selectedItemsCount}
                    headings={[
                      { title: "Image" },
                      { title: "Product" },
                      { title: "Images Needing Alt" },
                    ]}
                    {...selectedResources}
                  >
                    {products.map((product, index) => (
                      <IndexTable.Row
                        id={String(product.id)}
                        key={product.id}
                        selected={selectedResources.selectedResources.includes(String(product.id))}
                        position={index}
                      >
                        <IndexTable.Cell>
                          <Thumbnail
                            source={product.images[0]?.src || ""}
                            alt={product.title}
                            size="small"
                          />
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                          <Text as="p" fontWeight="semibold">{product.title}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">/{product.handle}</Text>
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                          <Badge>{product.images.length} images</Badge>
                        </IndexTable.Cell>
                      </IndexTable.Row>
                    ))}
                  </IndexTable>

                  {/* Generation Results with Retry */}
                  {actionData?.success && "results" in actionData && actionData.results && (
                    <Card>
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingSm">
                          Generation Results ({actionData.results.filter((r: any) => r.success).length} succeeded, {actionData.results.filter((r: any) => !r.success).length} failed)
                        </Text>

                        {actionData.results.filter((r: any) => !r.success).length > 0 && (
                          <>
                            <Banner tone="critical" title="Some items failed">
                              <Text as="p">Failed items can be retried individually.</Text>
                            </Banner>
                            <List type="bullet">
                              {actionData.results
                                .filter((r: any) => !r.success)
                                .map((r: any) => (
                                  <List.Item key={r.imageId || r.productId}>
                                    <InlineStack gap="200" wrap={false} align="space-between">
                                      <BlockStack gap="100">
                                        <Text as="p" variant="bodySm" fontWeight="semibold">
                                          {r.productTitle || `Image #${r.imageId}`}
                                        </Text>
                                        <Text as="p" variant="bodySm" tone="critical">
                                          {r.error || "Unknown error"}
                                        </Text>
                                      </BlockStack>
                                      <Button
                                        size="slim"
                                        variant="plain"
                                        onClick={() => {
                                          const fd = new FormData();
                                          fd.set("intent", "generate_alt");
                                          fd.set("autoApply", autoApply);
                                          fd.append("imageIds", String(r.imageId));
                                          submit(fd, { method: "post" });
                                        }}
                                      >
                                        Retry
                                      </Button>
                                    </InlineStack>
                                  </List.Item>
                                ))}
                            </List>
                          </>
                        )}
                      </BlockStack>
                    </Card>
                  )}
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}