import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  // If shop param provided, go to auth/login to start OAuth
  if (shop) {
    return redirect(`/auth/login?shop=${encodeURIComponent(shop)}`);
  }
  
  // Otherwise go to /auth to show install form
  return redirect("/auth");
};
