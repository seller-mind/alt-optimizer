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
  Checkbox,

  EmptyState,
  SkeletonBodyText,
  Banner,
  Toast,
  Box,
} from "@shopify/polaris";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
      images: {
        take: 1,
      },
      _count: {
        select: { images: true },
      },
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

  // Show toast when sync completes
  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
      setToastContent(`✅ Synced ${actionData.synced} products from Shopify`);
      setToastActive(true);
    } else if (actionData.error) {
      setToastContent(`❌ Sync failed: ${actionData.error}`);
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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Always compute valid selection from current products
  const validSelectedIds = useMemo(() => {
    const currentIds = new Set(products.map((p) => p.id));
    const valid = new Set<string>();
    selectedIds.forEach((id) => {
      if (currentIds.has(id)) valid.add(id);
    });
    return valid;
  }, [selectedIds, products]);

  // Auto-clear when product list changes (by ID, not just count)
  const productIdsKey = products.map((p) => p.id).sort().join(",");
  const prevProductIdsKey = useRef(productIdsKey);
  useEffect(() => {
    if (prevProductIdsKey.current !== productIdsKey) {
      setSelectedIds(new Set());
      prevProductIdsKey.current = productIdsKey;
    }
  }, [productIdsKey]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const valid = new Set(products.map((p) => p.id));
      // Check against valid selection, not raw prev
      const currentlyAllSelected = products.length > 0 && products.every((p) => validSelectedIds.has(p.id));
      if (currentlyAllSelected) {
        return new Set();
      }
      return valid;
    });
  }, [products, validSelectedIds]);

  const selectedCount = validSelectedIds.size;
  const allSelected = products.length > 0 && selectedCount === products.length;
  const someSelected = selectedCount > 0 && !allSelected;

  /** Truncate long product titles with ellipsis */
  const truncateTitle = (title: string, maxLen: number = 50): string => {
    if (title.length <= maxLen) return title;
    return title.substring(0, maxLen) + "…";
  };

  /** Show a placeholder for broken/missing image URLs */
  const renderThumbnail = (src: string | null, alt: string) => {
    if (!src) {
      return (
        <Box
          width="40px"
          height="40px"
          borderRadius="100"
          background="bg-surface-secondary"
        >
          <Text as="p" variant="bodyXs" alignment="center" tone="subdued">
            —
          </Text>
        </Box>
      );
    }
    return (
      <Thumbnail
        source={src}
        alt={alt}
        size="small"
      />
    );
  };

  const rows = products.map((product) => {
    const altStatus = product.imageCount === 0
      ? <Badge tone="subdued">No images</Badge>
      : product.missingAltCount === 0
        ? <Badge tone="success">Complete</Badge>
        : product.hasAltText
          ? <Badge tone="warning">Partial</Badge>
          : <Badge tone="critical">Missing</Badge>;

    const imageCountDisplay = product.imageCount === 0
      ? <Badge tone="subdued">No images</Badge>
      : <Text as="p">{product.imageCount}</Text>;

    return [
      renderThumbnail(product.firstImage, product.title),
      <div>
        <Text as="p" variant="bodyMd" fontWeight="semibold">
          {truncateTitle(product.title)}
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          /{product.handle}
        </Text>
      </div>,
      imageCountDisplay,
      altStatus,
      product.hasJsonLd ? (
        <Badge tone="success">Yes</Badge>
      ) : (
        <Badge tone="subdued">No</Badge>
      ),
    ];
  });

  const toastMarkup = toastActive ? (
    <Toast content={toastContent} onDismiss={() => setToastActive(false)} />
  ) : null;

  return (
    <Page
      title="Products"
      subtitle={`${totalProducts} products found`}
      primaryAction={
        <Button
          variant="primary"
          onClick={handleSync}
          disabled={isSyncing}
          loading={isSyncing}
        >
          {isSyncing ? "Syncing…" : "Sync from Shopify"}
        </Button>
      }
    >
      {toastMarkup}
      <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Product Inventory
                  </Text>
                  <InlineStack gap="200">
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
                </InlineStack>

                {/* Loading skeleton */}
                {isSyncing ? (
                  <BlockStack gap="300">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <InlineStack key={i} gap="200" blockAlign="center">
                        <Box width="40px" height="40px" borderRadius="100" background="bg-surface-secondary" />
                        <Box flex={1}>
                          <SkeletonBodyText lines={1} />
                        </Box>
                        <Box width="60px">
                          <SkeletonBodyText lines={1} />
                        </Box>
                      </InlineStack>
                    ))}
                  </BlockStack>
                ) : products.length === 0 ? (
                  <EmptyState
                    heading="No products found"
                    action={{
                      content: "Sync from Shopify",
                      onAction: handleSync,
                    }}
                  >
                    <Text as="p">
                      Sync your products from Shopify to start optimizing alt text.
                    </Text>
                  </EmptyState>
                ) : (
                  <BlockStack gap="0">
                    {/* Selection bar */}
                    <InlineStack align="space-between" blockAlign="center" paddingBlockStart="200" paddingBlockEnd="200" paddingInlineStart="400" paddingInlineEnd="400">
                      <InlineStack gap="200" blockAlign="center">
                        <Checkbox
                          label=""
                          checked={allSelected}
                          indeterminate={someSelected}
                          onChange={toggleAll}
                        />
                        {selectedCount > 0 && (
                          <Text variant="bodySm" tone="subdued">
                            {selectedCount} selected
                          </Text>
                        )}
                      </InlineStack>
                      {selectedCount > 0 && (
                        <Button
                          variant="primary"
                          size="slim"
                          onClick={() => {
                            const ids = Array.from(validSelectedIds);
                            console.log("Generate alt text for:", ids);
                            // TODO: Navigate to generate page with selected IDs
                          }}
                        >
                          Generate Alt Text
                        </Button>
                      )}
                    </InlineStack>

                    {/* Table header */}
                    <InlineStack
                      blockAlign="center"
                      paddingBlockStart="200"
                      paddingBlockEnd="200"
                      paddingInlineStart="400"
                      paddingInlineEnd="400"
                      style={{
                        borderBottom: "1px solid var(--p-color-border-subdued)",
                        background: "var(--p-color-bg-surface-secondary)",
                      }}
                    >
                      <Box width="40px" />
                      <Box flex={1}>
                        <Text variant="bodySm" fontWeight="semibold" tone="subdued">Product</Text>
                      </Box>
                      <Box width="80px">
                        <Text variant="bodySm" fontWeight="semibold" tone="subdued">Images</Text>
                      </Box>
                      <Box width="120px">
                        <Text variant="bodySm" fontWeight="semibold" tone="subdued">Alt Status</Text>
                      </Box>
                      <Box width="80px">
                        <Text variant="bodySm" fontWeight="semibold" tone="subdued">JSON-LD</Text>
                      </Box>
                    </InlineStack>

                    {/* Product rows */}
                    {products.map((product) => {
                      const isChecked = validSelectedIds.has(product.id);
                      const altStatus = product.imageCount === 0
                        ? <Badge tone="subdued">No images</Badge>
                        : product.missingAltCount === 0
                          ? <Badge tone="success">Complete</Badge>
                          : product.hasAltText
                            ? <Badge tone="warning">Partial</Badge>
                            : <Badge tone="critical">Missing</Badge>;

                      return (
                        <InlineStack
                          key={product.id}
                          blockAlign="center"
                          paddingBlockStart="200"
                          paddingBlockEnd="200"
                          paddingInlineStart="400"
                          paddingInlineEnd="400"
                          style={{
                            borderBottom: "1px solid var(--p-color-border-subdued)",
                            cursor: "pointer",
                          }}
                          onClick={() => toggleOne(product.id)}
                        >
                          <Box width="40px">
                            <Checkbox
                              label=""
                              checked={isChecked}
                              onChange={() => toggleOne(product.id)}
                            />
                          </Box>
                          <Box flex={1}>
                            <Text as="p" variant="bodyMd" fontWeight="semibold">
                              {truncateTitle(product.title)}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              /{product.handle}
                            </Text>
                          </Box>
                          <Box width="80px">
                            {product.imageCount === 0 ? (
                              <Badge tone="subdued">No images</Badge>
                            ) : (
                              <Text as="p">{product.imageCount}</Text>
                            )}
                          </Box>
                          <Box width="120px">{altStatus}</Box>
                          <Box width="80px">
                            {product.hasJsonLd ? (
                              <Badge tone="success">Yes</Badge>
                            ) : (
                              <Badge tone="subdued">No</Badge>
                            )}
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