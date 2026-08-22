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
  Badge,
  Thumbnail,
  IndexTable,
  TextField,
  Select,
  Banner,
  EmptyState,
  Modal,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { updateImageAltText } from "~/services/shopify.server";

type ReviewFilter = "all" | "pending" | "approved" | "rejected";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }

  const url = new URL(request.url);
  const filter = (url.searchParams.get("filter") || "pending") as ReviewFilter;

  const imagesWhere: Record<string, unknown> = {
    altTextAi: { not: null },
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
        },
      },
    },
    orderBy: { id: "desc" },
    take: 100,
  });

  const counts = await prisma.productImage.groupBy({
    by: ["status"],
    where: { altTextAi: { not: null } },
    _count: true,
  });

  const statusCounts = {
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  for (const group of counts) {
    if (group.status in statusCounts) {
      statusCounts[group.status as keyof typeof statusCounts] = group._count;
    }
  }

  return {
    images: images.map((img) => ({
      id: img.id,
      src: img.src,
      altTextOriginal: img.altTextOriginal,
      altTextAi: img.altTextAi,
      status: img.status,
      shopifyImageId: img.shopifyImageId,
      productTitle: img.product.title,
      productHandle: img.product.handle,
    })),
    filter,
    statusCounts,
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

  if (intent === "approve") {
    const imageIds = formData.getAll("imageIds") as string[];
    let approved = 0;

    for (const imageIdStr of imageIds) {
      const imageId = parseInt(imageIdStr, 10);
      const image = await prisma.productImage.findUnique({
        where: { id: imageId },
      });

      if (!image || !image.altTextAi) continue;

      const success = await updateImageAltText(admin, image.shopifyImageId, image.altTextAi);

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
      }
    }

    return json({ success: true, approved });
  }

  if (intent === "reject") {
    const imageIds = formData.getAll("imageIds") as string[];

    for (const imageIdStr of imageIds) {
      const imageId = parseInt(imageIdStr, 10);
      await prisma.productImage.update({
        where: { id: imageId },
        data: { status: "rejected" },
      });
    }

    return json({ success: true, rejected: imageIds.length });
  }

  if (intent === "edit") {
    const imageId = parseInt(formData.get("imageId") as string, 10);
    const newAltText = formData.get("altText") as string;

    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return json({ success: false, error: "Image not found" });
    }

    await prisma.productImage.update({
      where: { id: imageId },
      data: { altTextAi: newAltText },
    });

    const autoApply = formData.get("autoApply") === "true";
    if (autoApply) {
      const success = await updateImageAltText(admin, image.shopifyImageId, newAltText);
      if (success) {
        await prisma.productImage.update({
          where: { id: imageId },
          data: {
            altTextOriginal: newAltText,
            status: "applied",
          },
        });
      }
    }

    return json({ success: true });
  }

  if (intent === "bulk_approve") {
    const pendingImages = await prisma.productImage.findMany({
      where: {
        product: { shopId: shop.id },
        status: "pending",
        altTextAi: { not: null },
      },
    });

    let approved = 0;
    for (const image of pendingImages) {
      if (!image.altTextAi) continue;

      const success = await updateImageAltText(admin, image.shopifyImageId, image.altTextAi);
      if (success) {
        await prisma.productImage.update({
          where: { id: image.id },
          data: {
            altTextOriginal: image.altTextAi,
            status: "applied",
          },
        });
        approved++;
      }
    }

    return json({ success: true, approved });
  }

  return json({ success: false, error: "Unknown action" });
};

export default function ReviewPage() {
  const { images, filter, statusCounts } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isProcessing = navigation.state !== "idle";

  const [selectedFilter, setSelectedFilter] = useState<string>(filter);
  const [editingImage, setEditingImage] = useState<{
    id: number;
    altText: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  const handleFilterChange = useCallback(
    (value: string) => {
      setSelectedFilter(value);
      const params = new URLSearchParams();
      if (value !== "pending") params.set("filter", value);
      submit(params, { method: "get" });
    },
    [submit]
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

  const handleEdit = useCallback((id: number, altText: string) => {
    setEditingImage({ id, altText });
    setEditValue(altText);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingImage) return;
    const formData = new FormData();
    formData.set("intent", "edit");
    formData.set("imageId", String(editingImage.id));
    formData.set("altText", editValue);
    formData.set("autoApply", "true");
    submit(formData, { method: "post" });
    setEditingImage(null);
  }, [editingImage, editValue, submit]);

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

  return (
    <Page
      title="Review & Approve"
      subtitle="Review AI-generated alt text before applying to your store"
      primaryAction={
        statusCounts.pending > 0 ? (
          <Button variant="primary" onClick={handleBulkApprove} disabled={isProcessing}>
            Approve All Pending ({statusCounts.pending})
          </Button>
        ) : undefined
      }
    >
      <Layout>
        {actionData?.success && (
          <Layout.Section>
            <Banner title="Success" tone="success">
              <Text as="p">
                {"approved" in actionData
                  ? `Approved ${actionData.approved} images.`
                  : "Operation completed successfully."}
              </Text>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="300">
                  <Text as="h2" variant="headingMd">
                    Alt Text Review
                  </Text>
                  <InlineStack gap="100">
                    <Badge tone="info">Pending: {statusCounts.pending}</Badge>
                    <Badge tone="success">Applied: {statusCounts.approved}</Badge>
                    <Badge tone="critical">Rejected: {statusCounts.rejected}</Badge>
                  </InlineStack>
                </InlineStack>
                <Select
                  label=""
                  labelInline
                  options={[
                    { label: "Pending Review", value: "pending" },
                    { label: "All", value: "all" },
                    { label: "Applied", value: "approved" },
                    { label: "Rejected", value: "rejected" },
                  ]}
                  value={selectedFilter}
                  onChange={handleFilterChange}
                />
              </InlineStack>

              {images.length === 0 ? (
                <EmptyState heading="No images to review">
                  <Text as="p">
                    {filter === "pending"
                      ? "All images have been reviewed. Generate more alt text to review."
                      : "No images match the selected filter."}
                  </Text>
                </EmptyState>
              ) : (
                <>
                  <InlineStack gap="200">
                    <Button
                      onClick={() => handleApprove(selectedResources)}
                      disabled={selectedResources.length === 0 || isProcessing}
                      variant="primary"
                    >
                      Approve Selected ({selectedResources.length})
                    </Button>
                    <Button
                      onClick={() => handleReject(selectedResources)}
                      disabled={selectedResources.length === 0 || isProcessing}
                      tone="critical"
                    >
                      Reject Selected
                    </Button>
                  </InlineStack>

                  <IndexTable
                    resourceName={{ singular: "image", plural: "images" }}
                    itemCount={images.length}
                    selectedItemsCount={selectedResources.length}
                    onSelectionChange={(selectionType, toggleIds) => {
                      if (selectionType === "page") {
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
                  >
                    {images.map((image, index) => (
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
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {image.productTitle}
                          </Text>
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                          <Text as="p" variant="bodySm">
                            {image.altTextOriginal || (
                              <Text as="span" tone="subdued">No alt text</Text>
                            )}
                          </Text>
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                          <Text as="p" variant="bodySm" color="success">
                            {image.altTextAi}
                          </Text>
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                          <Badge
                            tone={
                              image.status === "applied"
                                ? "success"
                                : image.status === "rejected"
                                  ? "critical"
                                  : "info"
                            }
                          >
                            {image.status}
                          </Badge>
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                          <InlineStack gap="100">
                            <Button
                              size="slim"
                              variant="plain"
                              onClick={() => handleApprove([String(image.id)])}
                              disabled={image.status === "applied"}
                            >
                              Approve
                            </Button>
                            <Button
                              size="slim"
                              variant="plain"
                              onClick={() => handleEdit(image.id, image.altTextAi || "")}
                            >
                              Edit
                            </Button>
                            <Button
                              size="slim"
                              variant="plain"
                              tone="critical"
                              onClick={() => handleReject([String(image.id)])}
                              disabled={image.status === "rejected"}
                            >
                              Reject
                            </Button>
                          </InlineStack>
                        </IndexTable.Cell>
                      </IndexTable.Row>
                    ))}
                  </IndexTable>
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {editingImage && (
        <Modal
          open={true}
          onClose={() => setEditingImage(null)}
          title="Edit Alt Text"
          primaryAction={{
            content: "Save & Apply",
            onAction: handleSaveEdit,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setEditingImage(null),
            },
          ]}
        >
          <Modal.Section>
            <TextField
              label="Alt Text"
              value={editValue}
              onChange={setEditValue}
              maxLength={125}
              showCharacterCount
              multiline={3}
              autoComplete="off"
            />
            <Text as="p" variant="bodySm" tone="subdued">
              Maximum 125 characters for optimal accessibility.
            </Text>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
