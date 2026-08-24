import prisma from "~/db.server";
import { fetchProducts, type ShopifyProduct } from "./shopify.server";

export async function syncProductsFromShopify(
  shopId: number,
  admin: any
): Promise<{ synced: number; total: number }> {
  let cursor: string | null = null;
  let totalSynced = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await fetchProducts(admin, cursor);

    for (const product of result.products) {
      await upsertProduct(shopId, product);
      totalSynced++;
    }

    cursor = result.cursor;
    hasMore = cursor !== null;
  }

  return { synced: totalSynced, total: totalSynced };
}

async function upsertProduct(shopId: number, product: ShopifyProduct): Promise<void> {
  const existingProduct = await prisma.product.findFirst({
    where: {
      shopId,
      shopifyProductId: product.id,
    },
  });

  let productId: number;

  if (existingProduct) {
    const updated = await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        title: product.title,
        handle: product.handle,
        description: product.description,
        imageCount: product.images.length,
      },
    });
    productId = updated.id;
  } else {
    const created = await prisma.product.create({
      data: {
        shopId,
        shopifyProductId: product.id,
        title: product.title,
        handle: product.handle,
        description: product.description,
        imageCount: product.images.length,
      },
    });
    productId = created.id;
  }

  for (const image of product.images) {
    await upsertProductImage(productId, image, product.tags);
  }
}

async function upsertProductImage(
  productId: number,
  image: { id: string; src: string; altText: string | null },
  tags: string[]
): Promise<void> {
  const existingImage = await prisma.productImage.findFirst({
    where: {
      productId,
      shopifyImageId: image.id,
    },
  });

  if (existingImage) {
    await prisma.productImage.update({
      where: { id: existingImage.id },
      data: {
        src: image.src,
        altTextOriginal: image.altText,
        tagsOriginal: tags.join(", "),
      },
    });
  } else {
    await prisma.productImage.create({
      data: {
        productId,
        shopifyImageId: image.id,
        src: image.src,
        altTextOriginal: image.altText,
        tagsOriginal: tags.join(", "),
        status: image.altText ? "approved" : "pending",
      },
    });
  }
}

export async function getProductsForReview(
  shopId: number,
  filter: "all" | "missing_alt" | "has_alt" | "has_ai" | "pending" = "all"
): Promise<
  Array<{
    id: number;
    title: string;
    handle: string;
    images: Array<{
      id: number;
      src: string;
      altTextOriginal: string | null;
      altTextAi: string | null;
      status: string;
      tagsOriginal: string | null;
      tagsAi: string | null;
    }>;
  }>
> {
  const where: Record<string, unknown> = { shopId };

  const imagesWhere: Record<string, unknown> = {};

  switch (filter) {
    case "missing_alt":
      imagesWhere.altTextOriginal = null;
      break;
    case "has_alt":
      imagesWhere.altTextOriginal = { not: null };
      break;
    case "has_ai":
      imagesWhere.altTextAi = { not: null };
      break;
    case "pending":
      imagesWhere.status = "pending";
      break;
  }

  if (Object.keys(imagesWhere).length > 0) {
    where.images = { some: imagesWhere };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      images: Object.keys(imagesWhere).length > 0 ? { where: imagesWhere } : true,
    },
    orderBy: { title: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    images: p.images.map((img) => ({
      id: img.id,
      src: img.src,
      altTextOriginal: img.altTextOriginal,
      altTextAi: img.altTextAi,
      status: img.status,
      tagsOriginal: img.tagsOriginal,
      tagsAi: img.tagsAi,
    })),
  }));
}

export async function getShopByDomain(shopDomain: string) {
  return prisma.shop.findUnique({
    where: { shopDomain },
  });
}

export async function getShopById(shopId: number) {
  return prisma.shop.findUnique({
    where: { id: shopId },
  });
}

export async function getDashboardStats(shopId: number) {
  const [
    totalProducts,
    totalImages,
    imagesWithAlt,
    imagesWithAi,
    imagesPending,
    usageMetrics,
  ] = await Promise.all([
    prisma.product.count({ where: { shopId } }),
    prisma.productImage.count({ where: { product: { shopId } } }),
    prisma.productImage.count({
      where: { product: { shopId }, altTextOriginal: { not: null } },
    }),
    prisma.productImage.count({
      where: { product: { shopId }, altTextAi: { not: null } },
    }),
    prisma.productImage.count({
      where: { product: { shopId }, status: "pending" },
    }),
    prisma.usageMetric.aggregate({
      where: { shopId },
      _sum: { imagesGenerated: true, apiCalls: true },
    }),
  ]);

  return {
    totalProducts,
    totalImages,
    imagesWithAlt,
    imagesWithAi,
    imagesPending,
    totalGenerated: usageMetrics._sum.imagesGenerated || 0,
    totalApiCalls: usageMetrics._sum.apiCalls || 0,
  };
}
