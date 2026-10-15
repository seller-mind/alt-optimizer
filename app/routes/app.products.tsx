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
  IndexTable,
  BulkActions,
  EmptyState,
  SkeletonBodyText,
  Banner,
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
    setSelectedIds(new Set()); // Reset selection before sync
    const formData = new FormData();
    formData.set("intent", "sync");
    submit(formData, { method: "post" });
  }, [submit]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectionChange = useCallback((
    newSelectedResources: string[],
    _allSelected: boolean,
    _selectionChanged: string[],
    _allPageItemsSelected: boolean,
  ) => {
    setSelectedIds(new Set(newSelectedResources));
  }, []);

  const selectedCount = selectedIds.size;
  const allSelected = products.length > 0 && selectedCount === products.length;

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

                  {/* Bulk Actions Bar */}
                  {selectedCount > 0 && (
                    <BulkActions
                      selectedItemsCount={selectedCount}
                      onDismiss={() => setSelectedIds(new Set())}
                      actions={[
                        {
                          content: "Generate Alt Text",
                          onAction: () => {
                            // Store selected IDs and navigate to generate page
                            sessionStorage.setItem("selectedProductIds", Array.from(selectedIds).join(","));
                            window.location.href = "/app/generate";
                          },
                        },
                      ]}
                    />
                  )}

                  <IndexTable
                    resourceName={{ singular: "product", plural: "products" }}
                    itemCount={products.length}
                    selectedItemsCount={allSelected ? "All" : selectedCount}
                    headings={[
                      { title: "Image" },
                      { title: "Product" },
                      { title: "Images" },
                      { title: "Alt Status" },
                      { title: "JSON-LD" },
                    ]}
                    onSelectionChange={handleSelectionChange}
                  >
                    {products.map((product, index) => {
                      const altStatus = product.imageCount === 0
                        ? <Badge tone="subdued">No images</Badge>
                        : product.missingAltCount === 0
                          ? <Badge tone="success">Complete</Badge>
                          : product.hasAltText
                            ? <Badge tone="warning">Partial</Badge>
                            : <Badge tone="critical">Missing</Badge>;

                      return (
                        <IndexTable.Row
                          id={product.id}
                          key={product.id}
                          selected={selectedIds.has(product.id)}
                          position={index}
                        >
                          <IndexTable.Cell>
                            {product.firstImage ? (
                              <Thumbnail
                                source={product.firstImage}
                                alt={product.title}
                                size="small"
                              />
                            ) : (
                              <Box
                                width="40px"
                                height="40px"
                                borderRadius="100"
                                background="bg-surface-secondary"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Text as="p" variant="bodyXs" tone="subdued" alignment="center">
                                  —
                                </Text>
                              </Box>
                            )}
                          </IndexTable.Cell>
                          <IndexTable.Cell>
                            <Text as="p" variant="bodyMd" fontWeight="semibold">
                              {truncateTitle(product.title)}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              /{product.handle}
                            </Text>
                          </IndexTable.Cell>
                          <IndexTable.Cell>
                            {product.imageCount === 0 ? (
                              <Badge tone="subdued">No images</Badge>
                            ) : (
                              <Text as="p">{product.imageCount}</Text>
                            )}
                          </IndexTable.Cell>
                          <IndexTable.Cell>{altStatus}</IndexTable.Cell>
                          <IndexTable.Cell>
                            {product.hasJsonLd ? (
                              <Badge tone="success">Yes</Badge>
                            ) : (
                              <Badge tone="subdued">No</Badge>
                            )}
                          </IndexTable.Cell>
                        </IndexTable.Row>
                      );
                    })}
                  </IndexTable>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
    </Page>
  );
}