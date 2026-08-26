import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  // Redirect to /app with shop param to trigger OAuth flow
  if (shop) {
    return redirect(`/app?shop=${encodeURIComponent(shop)}`);
  }
  
  // No shop param - redirect to install page
  return redirect("/install");
};
