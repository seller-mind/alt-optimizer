import prisma from "~/db.server";

/**
 * Get or auto-create a Shop record.
 * Prevents 404 when afterAuth hook didn't create the record (e.g., existing installs before the fix).
 */
export async function getOrCreateShop(shopDomain: string, accessToken: string = "") {
  let shop = await prisma.shop.findUnique({
    where: { shopDomain },
  });

  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        shopDomain,
        accessToken: accessToken || "",
        planType: "free",
        status: "active",
      },
    });
    console.log(`[AltOptimizer] Auto-created missing shop record for: ${shopDomain}`);
  }

  return shop;
}
