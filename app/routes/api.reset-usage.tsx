import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "~/db.server";

// TEMPORARY operational endpoint. Remove immediately after use.
const TOKEN = "rs-20261104-a7f2c9";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  if (url.searchParams.get("k") !== TOKEN) {
    return new Response("Not found", { status: 404 });
  }

  const domain = url.searchParams.get("shop") || "";
  const shop = await prisma.shop.findFirst({ where: { shopDomain: domain } });
  if (!shop) {
    return json({ ok: false, error: "shop not found", domain }, { status: 404 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateStr = monthStart.toISOString().split("T")[0];

  const before = await prisma.usageMetric.findUnique({
    where: { shopId_date: { shopId: shop.id, date: dateStr } },
  });
  if (!before) {
    return json({ ok: true, note: "no record for this month", date: dateStr });
  }

  const after = await prisma.usageMetric.update({
    where: { shopId_date: { shopId: shop.id, date: dateStr } },
    data: { imagesGenerated: 0, tagsGenerated: 0, jsonLdGenerated: 0 },
  });

  return json({ ok: true, date: dateStr, before, after });
}
