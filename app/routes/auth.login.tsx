import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import shopify, { authenticate } from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  // If no shop param, redirect to install page where user can enter their store
  if (!shop) {
    return redirect("/install");
  }

  // With shop param, use the SDK login to initiate OAuth
  try {
    const result = await shopify.login(request);
    if (result instanceof Response) {
      // Only return the response if it has a Location header (valid redirect)
      if (result.headers.has("Location")) {
        return result;
      }
    }
    // If login returned errors or invalid response, redirect to install
    return redirect("/install");
  } catch (error) {
    // If the SDK threw a Response (e.g., redirect), re-throw valid redirects only
    if (error instanceof Response) {
      if (error.headers.has("Location")) {
        throw error;
      }
    }
    // Any other error → redirect to install page
    console.error("[AltOptimizer] auth.login loader error:", error);
    return redirect("/install");
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  let shop = url.searchParams.get("shop");

  // Also check form data for shop (from POST form)
  if (!shop) {
    try {
      const formData = await request.formData();
      shop = formData.get("shop") as string | null;
    } catch {
      // Not a form submission
    }
  }

  if (!shop) {
    return redirect("/install");
  }

  try {
    const result = await shopify.login(request);
    if (result instanceof Response) {
      if (result.headers.has("Location")) {
        return result;
      }
    }
    return redirect("/install");
  } catch (error) {
    if (error instanceof Response && error.headers.has("Location")) {
      throw error;
    }
    console.error("[AltOptimizer] auth.login action error:", error);
    return redirect("/install");
  }
}
