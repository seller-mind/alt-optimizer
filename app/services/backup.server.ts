import prisma from "~/db.server";

interface BackupData {
  products: Array<{
    shopifyProductId: string;
    title: string;
    handle: string;
    images: Array<{
      shopifyImageId: string;
      src: string;
      altTextOriginal: string | null;
      altTextAi: string | null;
      status: string;
      tagsOriginal: string | null;
      tagsAi: string | null;
    }>;
  }>;
}

export async function createBackup(shopId: number): Promise<{
  id: number;
  createdAt: Date;
  recordCount: number;
}> {
  const products = await prisma.product.findMany({
    where: { shopId },
    include: {
      images: true,
    },
  });

  const backupData: BackupData = {
    products: products.map((p) => ({
      shopifyProductId: p.shopifyProductId,
      title: p.title,
      handle: p.handle,
      images: p.images.map((img) => ({
        shopifyImageId: img.shopifyImageId,
        src: img.src,
        altTextOriginal: img.altTextOriginal,
        altTextAi: img.altTextAi,
        status: img.status,
        tagsOriginal: img.tagsOriginal,
        tagsAi: img.tagsAi,
      })),
    })),
  };

  const totalImages = products.reduce((sum, p) => sum + p.images.length, 0);

  const snapshot = await prisma.backupSnapshot.create({
    data: {
      shopId,
      recordCount: totalImages,
      data: JSON.stringify(backupData),
    },
  });

  return {
    id: snapshot.id,
    createdAt: snapshot.createdAt,
    recordCount: snapshot.recordCount,
  };
}

export async function listBackups(shopId: number): Promise<
  Array<{
    id: number;
    createdAt: Date;
    recordCount: number;
  }>
> {
  const backups = await prisma.backupSnapshot.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      recordCount: true,
    },
  });

  return backups;
}

export async function restoreBackup(shopId: number, backupId: number): Promise<{
  success: boolean;
  message: string;
}> {
  const backup = await prisma.backupSnapshot.findFirst({
    where: { id: backupId, shopId },
  });

  if (!backup) {
    return { success: false, message: "Backup not found" };
  }

  const backupData: BackupData = JSON.parse(backup.data);

  for (const productData of backupData.products) {
    const product = await prisma.product.findFirst({
      where: {
        shopId,
        shopifyProductId: productData.shopifyProductId,
      },
    });

    if (!product) continue;

    for (const imageData of productData.images) {
      await prisma.productImage.updateMany({
        where: {
          productId: product.id,
          shopifyImageId: imageData.shopifyImageId,
        },
        data: {
          altTextOriginal: imageData.altTextOriginal,
          altTextAi: imageData.altTextAi,
          status: imageData.status,
          tagsOriginal: imageData.tagsOriginal,
          tagsAi: imageData.tagsAi,
        },
      });
    }
  }

  return {
    success: true,
    message: `Successfully restored ${backupData.products.length} products`,
  };
}

export async function deleteBackup(shopId: number, backupId: number): Promise<void> {
  await prisma.backupSnapshot.deleteMany({
    where: { id: backupId, shopId },
  });
}

export async function exportToCsv(shopId: number): Promise<string> {
  const products = await prisma.product.findMany({
    where: { shopId },
    include: {
      images: true,
    },
  });

  const rows: string[] = [];
  rows.push("Product Title,Product Handle,Image ID,Image URL,Original Alt Text,AI Alt Text,Status,Original Tags,AI Tags");

  for (const product of products) {
    for (const image of product.images) {
      const row = [
        `"${product.title.replace(/"/g, '""')}"`,
        product.handle,
        image.shopifyImageId,
        image.src,
        `"${(image.altTextOriginal || "").replace(/"/g, '""')}"`,
        `"${(image.altTextAi || "").replace(/"/g, '""')}"`,
        image.status,
        `"${(image.tagsOriginal || "").replace(/"/g, '""')}"`,
        `"${(image.tagsAi || "").replace(/"/g, '""')}"`,
      ];
      rows.push(row.join(","));
    }
  }

  return rows.join("\n");
}
