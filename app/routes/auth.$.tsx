import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // OAuth callback must use public auth to exchange code for session
  const { session } = await authenticate.public(request);

  if (!session) {
    return new Response("OAuth failed: no session created", { status: 500 });
  }

  // Ensure shop record exists
  try {
    if (prisma) {
      const existingShop = await prisma.shop.findUnique({
        where: { shopDomain: session.shop },
      });

      if (!existingShop) {
        await prisma.shop.create({
          data: {
            shopDomain: session.shop,
            accessToken: session.accessToken || "",
            planType: "free",
            status: "active",
          },
        });
      } else {
        await prisma.shop.update({
          where: { shopDomain: session.shop },
          data: {
            status: "active",
            accessToken: session.accessToken || existingShop.accessToken,
          },
        });
      }
    }
  } catch (error) {
    console.error("[AltOptimizer] Failed to create/update shop record:", error);
  }

  // Redirect to the app
  return redirect("/app");
};
