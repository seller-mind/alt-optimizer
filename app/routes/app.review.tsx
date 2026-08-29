import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, useLoaderData, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  ButtonGroup,
  BlockStack,
  InlineStack,
  Badge,
  Thumbnail,
  IndexTable,
  TextField,
  Banner,
  EmptyState,
  ProgressBar,
  Tabs,
  Tooltip,
  Box,
  InlineError,
} from "@shopify/polaris";
import { useState, useCallback, useMemo } from "react";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { updateImageAltText } from "~/services/shopify.server";
import { getOrCreateShop } from "~/utils/shop.server";

type ReviewFilter = "all" | "pending" | "applied" | "rejected";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const url = new URL(request.url);
  const filter = (url.searchParams.get("filter") || "pending") as ReviewFilter;

  const imagesWhere: Record<string, unknown> = {
    altTextAi: { not: null },
    product: { shopId: shop.id },
  };

  if (filter !== "all") {
    imagesWhere.status = filter;
  }

  const images = await prisma.productImage.findMany({
    where: imagesWhere,
    include: {
      product: {
        select: {
          title: true,
          handle: true,
          shopifyProductId: true,
        },
      },
    },
    orderBy: { id: "desc" },
    take: 100,
  });

  const allWithAi = await prisma.productImage.count({
    where: { altTextAi: { not: null }, product: { shopId: shop.id } },
  });

  const counts = await prisma.productImage.groupBy({
    by: ["status"],
    where: { altTextAi: { not: null }, product: { shopId: shop.id } },
    _count: true,
  });

  const statusCounts: Record<string, number> = {
    pending: 0,
    applied: 0,
    rejected: 0,
  };

  for (const group of counts) {
    if (group.status in statusCounts) {
      statusCounts[group.status] = group._count;
    }
  }

  const reviewed = (statusCounts.applied || 0) + (statusCounts.rejected || 0);

  return {
    images: images.map((img) => ({
      id: img.id,
      src: img.src,
      altTextOriginal: img.altTextOriginal,
      altTextAi: img.altTextAi,
      status: img.status,
      shopifyImageId: img.shopifyImageId,
      shopifyProductId: img.product.shopifyProductId,
      productTitle: img.product.title,
      productHandle: img.product.handle,
    })),
    filter,
    statusCounts,
    totalWithAi: allWithAi,
    reviewed,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    if (intent === "approve") {
      const imageIds = formData.getAll("imageIds") as string[];
      let approved = 0;
      let errors = 0;

      for (const imageIdStr of imageIds) {
        const imageId = parseInt(imageIdStr, 10);
        const image = await prisma.productImage.findFirst({
          where: { id: imageId, product: { shopId: shop.id } },
          include: { product: { select: { shopifyProductId: true } } },
        });

        if (!image || !image.altTextAi) continue;

        const success = await updateImageAltText(admin, image.product.shopifyProductId, image.shopifyImageId, image.altTextAi);

        if (success) {
          await prisma.productImage.update({
            where: { id: imageId },
            data: {
              altTextOriginal: image.altTextAi,
              status: "applied",
            },
          });

          await prisma.altTextHistory.create({
            data: {
              imageId,
              altText: image.altTextAi,
              source: "ai",
            },
          });

          approved++;
        } else {
          errors++;
        }
      }

      return json({ success: true, approved, errors, intent: "approve" });
    }

    if (intent === "reject") {
      const imageIds = formData.getAll("imageIds") as string[];
      let rejected = 0;

      for (const imageIdStr of imageIds) {
        const imageId = parseInt(imageIdStr, 10);
        const image = await prisma.productImage.findFirst({
          where: { id: imageId, product: { shopId: shop.id } },
        });
        if (!image) continue;

        await prisma.productImage.update({
          where: { id: imageId },
          data: { status: "rejected" },
        });
        rejected++;
      }

      return json({ success: true, rejected, intent: "reject" });
    }

    if (intent === "edit") {
      const imageId = parseInt(formData.get("imageId") as string, 10);
      const newAltText = formData.get("altText") as string;

      if (!newAltText || newAltText.trim().length === 0) {
        return json({ success: false, error: "Alt text cannot be empty", intent: "edit" });
      }

      if (newAltText.length > 125) {
        return json({ success: false, error: "Alt text must be 125 characters or less", intent: "edit" });
      }

      const image = await prisma.productImage.findFirst({
        where: { id: imageId, product: { shopId: shop.id } },
        include: { product: { select: { shopifyProductId: true } } },
      });

      if (!image) {
        return json({ success: false, error: "Image not found", intent: "edit" });
      }

      await prisma.productImage.update({
        where: { id: imageId },
        data: { altTextAi: newAltText.trim() },
      });

      const autoApply = formData.get("autoApply") === "true";
      if (autoApply) {
        const success = await updateImageAltText(admin, image.product.shopifyProductId, image.shopifyImageId, newAltText.trim());
        if (success) {
          await prisma.productImage.update({
            where: { id: imageId },
            data: {
              altTextOriginal: newAltText.trim(),
              status: "applied",
            },
          });
        }
      }

      return json({ success: true, intent: "edit" });
    }

    if (intent === "bulk_approve") {
      const pendingImages = await prisma.productImage.findMany({
        where: {
          product: { shopId: shop.id },
          status: "pending",
          altTextAi: { not: null },
        },
        include: { product: { select: { shopifyProductId: true } } },
      });

      let approved = 0;
      let errors = 0;
      for (const image of pendingImages) {
        if (!image.altTextAi) continue;

        const success = await updateImageAltText(admin, image.product.shopifyProductId, image.shopifyImageId, image.altTextAi);
        if (success) {
          await prisma.productImage.update({
            where: { id: image.id },
            data: {
              altTextOriginal: image.altTextAi,
              status: "applied",
            },
          });
          approved++;
        } else {
          errors++;
        }
      }

      return json({ success: true, approved, errors, intent: "bulk_approve" });
    }

    if (intent === "bulk_reject") {
      const pendingImages = await prisma.productImage.findMany({
        where: {
          product: { shopId: shop.id },
          status: "pending",
          altTextAi: { not: null },
        },
      });

      for (const image of pendingImages) {
        await prisma.productImage.update({
          where: { id: image.id },
          data: { status: "rejected" },
        });
      }

      return json({ success: true, rejected: pendingImages.length, intent: "bulk_reject" });
    }

    return json({ success: false, error: "Unknown action", intent: "unknown" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return json({ success: false, error: message, intent });
  }
};

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { tone: "success" | "critical" | "info" | "warning"; label: string }> = {
    applied: { tone: "success", label: "Applied" },
    pending: { tone: "info", label: "Pending" },
    rejected: { tone: "critical", label: "Rejected" },
    generated: { tone: "warning", label: "Generated" },
  };
  const c = config[status] || { tone: "info" as const, label: status };
  return <Badge tone={c.tone}>{c.label}</Badge>;
}

export default function ReviewPage() {
  const { images, filter, statusCounts, totalWithAi, reviewed } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isProcessing = navigation.state !== "idle";

  const [selectedFilter, setSelectedFilter] = useState<string>(filter);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [editingRow, setEditingRow] = useState<{ id: number; altText: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "critical" | "warning" } | null>(null);

  // Show toast from action data
  useMemo(() => {
    if (actionData?.success) {
      const ad = actionData as any;
      if (ad.intent === "approve" || ad.intent === "bulk_approve") {
        const msg = ad.errors > 0
          ? `Approved ${ad.approved} images (${ad.errors} failed to sync to Shopify)`
          : `Successfully approved ${ad.approved} images`;
        setToast({ message: msg, tone: ad.errors > 0 ? "warning" : "success" });
      } else if (ad.intent === "reject" || ad.intent === "bulk_reject") {
        setToast({ message: `Rejected ${ad.rejected} images`, tone: "success" });
      } else if (ad.intent === "edit") {
        setToast({ message: "Alt text updated successfully", tone: "success" });
      }
    } else if (actionData && !actionData.success) {
      setToast({ message: (actionData as any).error || "Operation failed", tone: "critical" });
    }
  }, [actionData]);

  const tabs = useMemo(() => [
    { id: "pending", content: `Pending (${statusCounts.pending || 0})` },
    { id: "applied", content: `Applied (${statusCounts.applied || 0})` },
    { id: "rejected", content: `Rejected (${statusCounts.rejected || 0})` },
    { id: "all", content: "All" },
  ], [statusCounts]);

  const selectedTabIndex = tabs.findIndex((t) => t.id === selectedFilter);

  const handleFilterChange = useCallback(
    (selectedTabIndex: number) => {
      const newFilter = tabs[selectedTabIndex].id;
      setSelectedFilter(newFilter);
      setSelectedResources([]);
      const params = new URLSearchParams();
      if (newFilter !== "pending") params.set("filter", newFilter);
      submit(params, { method: "get" });
    },
    [submit, tabs]
  );

  const handleApprove = useCallback(
    (ids: string[]) => {
      const formData = new FormData();
      formData.set("intent", "approve");
      ids.forEach((id) => formData.append("imageIds", id));
      submit(formData, { method: "post" });
    },
    [submit]
  );

  const handleReject = useCallback(
    (ids: string[]) => {
      const formData = new FormData();
      formData.set("intent", "reject");
      ids.forEach((id) => formData.append("imageIds", id));
      submit(formData, { method: "post" });
    },
    [submit]
  );

  const handleBulkApprove = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "bulk_approve");
    submit(formData, { method: "post" });
  }, [submit]);

  const handleBulkReject = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "bulk_reject");
    submit(formData, { method: "post" });
  }, [submit]);

  const handleStartEdit = useCallback((id: number, altText: string) => {
    setEditingRow({ id, altText });
    setEditValue(altText);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingRow) return;
    if (!editValue.trim()) return;
    if (editValue.length > 125) return;

    const formData = new FormData();
    formData.set("intent", "edit");
    formData.set("imageId", String(editingRow.id));
    formData.set("altText", editValue.trim());
    formData.set("autoApply", "true");
    submit(formData, { method: "post" });
    setEditingRow(null);
  }, [editingRow, editValue, submit]);

  const handleCancelEdit = useCallback(() => {
    setEditingRow(null);
    setEditValue("");
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedResources((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedResources.length === images.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(images.map((img) => String(img.id)));
    }
  }, [images, selectedResources.length]);

  const progressPercent = totalWithAi > 0 ? Math.round((reviewed / totalWithAi) * 100) : 0;
  const pendingCount = statusCounts.pending || 0;
  const isEditingRow = editingRow !== null;

  return (
    <Page
      title="Review & Approve"
      subtitle="Review AI-generated alt text before applying to your store"
    >
      <Layout>
        {toast && (
          <Layout.Section>
            <Banner
              title={toast.message}
              tone={toast.tone}
              onDismiss={() => setToast(null)}
            />
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              {/* Progress Bar */}
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Review Progress
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {reviewed} of {totalWithAi} reviewed
                </Text>
              </InlineStack>
              <ProgressBar progress={progressPercent} tone={progressPercent === 100 ? "success" : "info"} />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              {/* Tabs */}
              <Tabs tabs={tabs} selected={selectedTabIndex} onSelect={handleFilterChange} />

              {/* Bulk Actions */}
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200">
                  {selectedResources.length > 0 && (
                    <>
                      <Text as="p" variant="bodySm" fontWeight="semibold">
                        {selectedResources.length} selected
                      </Text>
                      <ButtonGroup>
                        <Button
                          onClick={() => handleApprove(selectedResources)}
                          disabled={isProcessing}
                          variant="primary"
                          size="slim"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(selectedResources)}
                          disabled={isProcessing}
                          tone="critical"
                          size="slim"
                        >
                          Reject
                        </Button>
                      </ButtonGroup>
                    </>
                  )}
                  {pendingCount > 0 && selectedResources.length === 0 && (
                    <ButtonGroup>
                      <Tooltip content="Approve all pending images and apply to Shopify store">
                        <Button
                          onClick={handleBulkApprove}
                          disabled={isProcessing}
                          variant="primary"
                          size="slim"
                        >
                          Approve All ({pendingCount})
                        </Button>
                      </Tooltip>
                      <Tooltip content="Reject all pending images">
                        <Button
                          onClick={handleBulkReject}
                          disabled={isProcessing}
                          tone="critical"
                          size="slim"
                        >
                          Reject All
                        </Button>
                      </Tooltip>
                    </ButtonGroup>
                  )}
                </InlineStack>
              </InlineStack>

              {/* Empty State */}
              {images.length === 0 ? (
                <EmptyState heading="No images to review">
                  <Text as="p">
                    {filter === "pending"
                      ? "All images have been reviewed! Generate more alt text or change the filter."
                      : "No images match the selected filter."}
                  </Text>
                </EmptyState>
              ) : (
                <IndexTable
                  resourceName={{ singular: "image", plural: "images" }}
                  itemCount={images.length}
                  selectedItemsCount={selectedResources.length}
                  onSelectionChange={(selectionType) => {
                    if (selectionType === "all") {
                      toggleAll();
                    }
                  }}
                  headings={[
                    { title: "Image" },
                    { title: "Product" },
                    { title: "Current Alt Text" },
                    { title: "AI Suggested" },
                    { title: "Status" },
                    { title: "Actions" },
                  ]}
                  hasZebraStriping
                >
                  {images.map((image, index) => {
                    const isEditingThis = editingRow?.id === image.id;
                    return (
                      <IndexTable.Row
                        id={String(image.id)}
                        key={image.id}
                        selected={selectedResources.includes(String(image.id))}
                        position={index}
                      >
                        <IndexTable.Cell>
                          <Thumbnail
                            source={image.src}
                            alt={image.altTextOriginal || "Product image"}
                            size="small"
                          />
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                          <Text as="p" variant="bodyMd" fontWeight="semibold" truncate>
                            {image.productTitle}
                          </Text>
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                          {image.altTextOriginal ? (
                            <Text as="p" variant="bodySm">
                              {image.altTextOriginal.length > 80
                                ? image.altTextOriginal.slice(0, 80) + "..."
                                : image.altTextOriginal}
                            </Text>
                          ) : (
                            <Text as="span" variant="bodySm" tone="subdued">
                              No alt text
                            </Text>
                          )}
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                          {isEditingThis ? (
                            <BlockStack gap="100">
                              <TextField
                                label=""
                                labelHidden
                                value={editValue}
                                onChange={setEditValue}
                                maxLength={125}
                                showCharacterCount
                                autoComplete="off"
                                autoFocus
                              />
                              <InlineStack gap="100">
                                <Button size="slim" variant="primary" onClick={handleSaveEdit} disabled={!editValue.trim()}>
                                  Save
                                </Button>
                                <Button size="slim" onClick={handleCancelEdit}>
                                  Cancel
                                </Button>
                              </InlineStack>
                            </BlockStack>
                          ) : (
                            <Box
                              padding="100"
                              background="bg-surface-secondary"
                              borderRadius="200"
                              minHeight="32px"
                              onClick={() => handleStartEdit(image.id, image.altTextAi || "")}
                              style={{ cursor: "pointer" }}
                            >
                              <Text as="p" variant="bodySm">
                                {image.altTextAi ? (
                                  image.altTextAi.length > 80
                                    ? image.altTextAi.slice(0, 80) + "..."
                                    : image.altTextAi
                                ) : (
                                  <Text as="span" tone="subdued">Not generated</Text>
                                )}
                              </Text>
                            </Box>
                          )}
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                          <StatusBadge status={image.status} />
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                          <ButtonGroup>
                            <Button
                              size="slim"
                              variant="plain"
                              onClick={() => handleApprove([String(image.id)])}
                              disabled={image.status === "applied" || isProcessing || isEditingRow}
                            >
                              Approve
                            </Button>
                            <Button
                              size="slim"
                              variant="plain"
                              onClick={() => handleStartEdit(image.id, image.altTextAi || "")}
                              disabled={isEditingRow}
                            >
                              Edit
                            </Button>
                            <Button
                              size="slim"
                              variant="plain"
                              tone="critical"
                              onClick={() => handleReject([String(image.id)])}
                              disabled={image.status === "rejected" || isProcessing || isEditingRow}
                            >
                              Reject
                            </Button>
                          </ButtonGroup>
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