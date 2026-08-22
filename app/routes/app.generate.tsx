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
  Banner,
  ProgressBar,
  Badge,
  Thumbnail,
  IndexTable,
  useIndexResourceState,
  FormLayout,
  ChoiceList,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { analyzeImage, generateTags, generateJsonLd } from "~/services/gemini.server";
import { fetchImageAsBase64, updateImageAltText, updateProductTags } from "~/services/shopify.server";
import { checkQuota, incrementUsage } from "~/services/billing.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }

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
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "generate_alt") {
    const imageIds = formData.getAll("imageIds") as string[];
    const autoApply = formData.get("autoApply") === "true";

    const quota = await checkQuota(shop.id);
    if (!quota.canGenerate) {
      return json({
        success: false,
        error: "Monthly quota exceeded. Please upgrade your plan.",
      });
    }

    const results: Array<{
      imageId: number;
      altText: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const imageIdStr of imageIds) {
      const imageId = parseInt(imageIdStr, 10);
      const image = await prisma.productImage.findUnique({
        where: { id: imageId },
        include: { product: true },
      });

      if (!image) continue;

      try {
        const { base64, mimeType } = await fetchImageAsBase64(image.src);
        const analysis = await analyzeImage(
          base64,
          mimeType,
          image.product.title,
          shop.locale
        );

        await prisma.productImage.update({
          where: { id: imageId },
          data: {
            altTextAi: analysis.altText,
            status: autoApply ? "applied" : "pending",
          },
        });

        if (autoApply) {
          await updateImageAltText(admin, image.shopifyImageId, analysis.altText);
        }

        await prisma.altTextHistory.create({
          data: {
            imageId,
            altText: analysis.altText,
            source: "ai",
          },
        });

        results.push({
          imageId,
          altText: analysis.altText,
          success: true,
        });
      } catch (err) {
        results.push({
          imageId,
          altText: "",
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    await incrementUsage(shop.id, imageIds.length);

    const successCount = results.filter((r) => r.success).length;
    return json({
      success: true,
      generated: successCount,
      total: imageIds.length,
      results,
    });
  }

  if (intent === "generate_tags") {
    const productIds = formData.getAll("productIds") as string[];

    const results: Array<{
      productId: number;
      tags: string[];
      success: boolean;
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
        const { base64, mimeType } = await fetchImageAsBase64(firstImage.src);
        const tagResult = await generateTags(
          base64,
          mimeType,
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
          tags: tagResult.tags,
          success: true,
        });
      } catch {
        results.push({ productId, tags: [], success: false });
      }
    }

    return json({
      success: true,
      results,
    });
  }

  if (intent === "generate_jsonld") {
    const productIds = formData.getAll("productIds") as string[];

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
      } catch {
        // Continue with next product
      }
    }

    return json({ success: true });
  }

  return json({ success: false, error: "Unknown action" });
};

export default function GeneratePage() {
  const { products, quota, shopLocale } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isGenerating = navigation.state !== "idle";

  const [generationType, setGenerationType] = useState<string>("alt_text");
  const [autoApply, setAutoApply] = useState<string>("false");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const allImageIds = products.flatMap((p) => p.images.map((img) => String(img.id)));
  const selectedResources = useIndexResourceState(products);

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

      selectedImageIds.forEach((id) => formData.append("imageIds", id));
    } else {
      const selectedProductIds = selectedResources.selectedResources.length > 0
        ? selectedResources.selectedResources
        : products.map((p) => String(p.id));

      selectedProductIds.forEach((id) => formData.append("productIds", id));
    }

    submit(formData, { method: "post" });
  }, [generationType, autoApply, selectedResources.selectedResources, products, allImageIds, submit]);

  return (
    <Page title="AI Generation" subtitle="Generate alt text, tags, and structured data">
      <Layout>
        {quota.warning && (
          <Layout.Section>
            <Banner
              title="Quota warning"
              tone={quota.percentage >= 95 ? "critical" : "warning"}
            >
              <Text as="p">
                You have used {quota.percentage}% of your monthly quota.
                {quota.remaining} generations remaining.
              </Text>
            </Banner>
          </Layout.Section>
        )}

        {actionData && actionData.success && (
          <Layout.Section>
            <Banner title="Generation complete" tone="success">
              <Text as="p">
                {"generated" in actionData
                  ? `Successfully generated ${actionData.generated} of ${actionData.total} alt texts.`
                  : "Operation completed successfully."}
              </Text>
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
                Generation Settings
              </Text>

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
                    disabled={isGenerating || products.length === 0}
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
              <Text as="h2" variant="headingMd">
                Eligible Products
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Select specific products or leave all selected to generate for all eligible items.
              </Text>

              {products.length === 0 ? (
                <Text as="p" alignment="center">
                  All products have alt text. No generation needed.
                </Text>
              ) : (
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
                        <Text as="p" variant="bodySm" tone="subdued">
                          /{product.handle}
                        </Text>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <Badge>{product.images.length} images</Badge>
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
