import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Badge,
  Button,
  BlockStack,
  InlineStack,
  Select,
  Thumbnail,
  EmptyState,
  SkeletonBodyText,
  Toast,
  Box,
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { syncProductsFromShopify } from "~/services/sync.server";
import { getOrCreateShop } from "~/utils/shop.server";

type FilterType = "all" | "missing_alt" | "has_alt" | "has_tags" | "has_jsonld";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const url = new URL(request.url);
  const filter = (url.searchParams.get("filter") || "all") as FilterType;

  const where: Record<string, unknown> = { shopId: shop.id };

  if (filter === "missing_alt") {
    where.images = { some: { altTextOriginal: null } };
  } else if (filter === "has_alt") {
    where.images = { some: { altTextOriginal: { not: null } } };
  } else if (filter === "has_tags") {
    where.images = { some: { tagsOriginal: { not: null } } };
  } else if (filter === "has_jsonld") {
    where.hasJsonLd = true;
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      images: { take: 1 },
      _count: { select: { images: true } },
    },
    orderBy: { title: "asc" },
    take: 100,
  });

  return {
    products: products.map((p) => ({
      id: String(p.id),
      shopifyProductId: p.shopifyProductId,
      title: p.title,
      handle: p.handle,
      imageCount: p._count.images,
      hasJsonLd: p.hasJsonLd,
      firstImage: p.images[0]?.src || null,
      hasAltText: p.images.some((img) => img.altTextOriginal !== null),
      missingAltCount: p.images.filter((img) => img.altTextOriginal === null).length,
    })),
    filter,
    totalProducts: products.length,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "sync") {
    try {
      const result = await syncProductsFromShopify(shop.id, admin);
      return json({ success: true, synced: result.synced });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return json({ success: false, error: msg });
    }
  }

  return json({ success: false });
};

export default function ProductsPage() {
  const { products, filter, totalProducts } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ success?: boolean; synced?: number; error?: string }>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSyncing = navigation.state !== "idle" && navigation.formData?.get("intent") === "sync";
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");

  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
      setToastContent(`Synced ${actionData.synced} products from Shopify`);
      setToastActive(true);
    } else if (actionData.error) {
      setToastContent(`Sync failed: ${actionData.error}`);
      setToastActive(true);
    }
  }, [actionData]);

  const [selectedFilter, setSelectedFilter] = useState<string>(filter);

  const handleFilterChange = useCallback(
    (value: string) => {
      setSelectedFilter(value);
      const params = new URLSearchParams();
      if (value !== "all") params.set("filter", value);
      submit(params, { method: "get" });
    },
    [submit]
  );

  const handleSync = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "sync");
    submit(formData, { method: "post" });
  }, [submit]);

  // ===== SELECTION STATE: dead simple =====
  // selectedIds is a plain string array. Always starts empty.
  // Recomputed from scratch on every products change.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // KEY FIX: Reset selection EVERY TIME products array reference changes
  // This runs on initial mount AND on every filter/sync change
  useEffect(() => {
    setSelectedIds([]);
  }, [products]);

  const handleToggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allIds = products.map((p) => p.id);
      if (allIds.length > 0 && allIds.every((id) => prev.includes(id))) {
        return [];
      }
      return allIds;
    });
  }, [products]);

  const selectedCount = selectedIds.length;
  const allSelected = products.length > 0 && selectedCount === products.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const truncateTitle = (title: string, maxLen = 50): string =>
    title.length <= maxLen ? title : title.substring(0, maxLen) + "\u2026";

  const toastMarkup = toastActive ? (
    <Toast content={toastContent} onDismiss={() => setToastActive(false)} />
  ) : null;

  return (
    <Page
      title="Products"
      subtitle={`${totalProducts} products found`}
      primaryAction={
        <Button variant="primary" onClick={handleSync} disabled={isSyncing} loading={isSyncing}>
          {isSyncing ? "Syncing\u2026" : "Sync from Shopify"}
        </Button>
      }
    >
      {toastMarkup}
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <Text as="h2" variant="headingMd">Product Inventory</Text>
                  <Badge tone="info">v2.0.0-FIXED</Badge>
                </InlineStack>
                <Select
                  label=""
                  labelInline
                  options={[
                    { label: "All Products", value: "all" },
                    { label: "Missing Alt Text", value: "missing_alt" },
                    { label: "Has Alt Text", value: "has_alt" },
                    { label: "Has Tags", value: "has_tags" },
                    { label: "Has JSON-LD", value: "has_jsonld" },
                  ]}
                  value={selectedFilter}
                  onChange={handleFilterChange}
                />
              </InlineStack>

              {isSyncing ? (
                <BlockStack gap="300">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <InlineStack key={i} gap="200" blockAlign="center">
                      <Box width="40px" height="40px" borderRadius="100" background="bg-surface-secondary" />
                      <Box flex={1}><SkeletonBodyText lines={1} /></Box>
                      <Box width="60px"><SkeletonBodyText lines={1} /></Box>
                    </InlineStack>
                  ))}
                </BlockStack>
              ) : products.length === 0 ? (
                <EmptyState
                  heading="No products found"
                  action={{ content: "Sync from Shopify", onAction: handleSync }}
                >
                  <Text as="p">Sync your products from Shopify to start optimizing alt text.</Text>
                </EmptyState>
              ) : (
                <BlockStack gap="0">
                  {/* Selection bar — only shows when items are selected */}
                  {selectedCount > 0 && (
                    <InlineStack
                      align="space-between"
                      blockAlign="center"
                      paddingBlockStart="200"
                      paddingBlockEnd="200"
                      paddingInlineStart="400"
                      paddingInlineEnd="400"
                      style={{ borderBottom: "1px solid var(--p-color-border-subdued)" }}
                    >
                      <Text variant="bodySm" tone="subdued">{selectedCount} selected</Text>
                      <Button
                        variant="primary"
                        size="slim"
                        onClick={() => {
                          console.log("Generate alt text for:", selectedIds);
                        }}
                      >
                        Generate Alt Text
                      </Button>
                    </InlineStack>
                  )}

                  {/* Table header with select-all checkbox */}
                  <InlineStack
                    blockAlign="center"
                    paddingBlockStart="200"
                    paddingBlockEnd="200"
                    paddingInlineStart="400"
                    paddingInlineEnd="400"
                    style={{ borderBottom: "1px solid var(--p-color-border-subdued)", background: "var(--p-color-bg-surface-secondary)" }}
                  >
                    <Box width="40px">
                      {/* Native HTML checkbox — zero Polaris interference */}
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleToggleAll}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                    </Box>
                    <Box flex={1}><Text variant="bodySm" fontWeight="semibold" tone="subdued">Product</Text></Box>
                    <Box width="80px"><Text variant="bodySm" fontWeight="semibold" tone="subdued">Images</Text></Box>
                    <Box width="120px"><Text variant="bodySm" fontWeight="semibold" tone="subdued">Alt Status</Text></Box>
                    <Box width="80px"><Text variant="bodySm" fontWeight="semibold" tone="subdued">JSON-LD</Text></Box>
                  </InlineStack>

                  {/* Product rows */}
                  {products.map((product) => {
                    const isChecked = selectedIds.includes(product.id);
                    const altStatus =
                      product.imageCount === 0 ? <Badge tone="subdued">No images</Badge> :
                      product.missingAltCount === 0 ? <Badge tone="success">Complete</Badge> :
                      product.hasAltText ? <Badge tone="warning">Partial</Badge> :
                      <Badge tone="critical">Missing</Badge>;

                    return (
                      <InlineStack
                        key={product.id}
                        blockAlign="center"
                        paddingBlockStart="200"
                        paddingBlockEnd="200"
                        paddingInlineStart="400"
                        paddingInlineEnd="400"
                        style={{ borderBottom: "1px solid var(--p-color-border-subdued)", cursor: "pointer" }}
                        onClick={() => handleToggleOne(product.id)}
                      >
                        <Box width="40px">
                          {/* Native HTML checkbox — zero Polaris interference */}
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleOne(product.id)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: 16, height: 16, cursor: "pointer" }}
                          />
                        </Box>
                        <Box flex={1}>
                          {product.firstImage ? (
                            <Thumbnail source={product.firstImage} alt={product.title} size="small" />
                          ) : (
                            <Box width="40px" height="40px" borderRadius="100" background="bg-surface-secondary" />
                          )}
                        </Box>
                        <Box flex={2}>
                          <Text as="p" variant="bodyMd" fontWeight="semibold">{truncateTitle(product.title)}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">/{product.handle}</Text>
                        </Box>
                        <Box width="80px">
                          {product.imageCount === 0 ? <Badge tone="subdued">No images</Badge> : <Text as="p">{product.imageCount}</Text>}
                        </Box>
                        <Box width="120px">{altStatus}</Box>
                        <Box width="80px">
                          {product.hasJsonLd ? <Badge tone="success">Yes</Badge> : <Badge tone="subdued">No</Badge>}
                        </Box>
                      </InlineStack>
                    );
                  })}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
