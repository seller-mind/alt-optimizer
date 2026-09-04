import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import shopify, { authenticate } from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  if (!shopify.login) {
    return json({ error: "Login not available" }, { status: 500 });
  }
  const result = await shopify.login(request);
  if (result instanceof Response) return result;
  if (result && typeof result === "object" && "shop" in result) {
    return json(result, { status: 400 });
  }
  return json({ message: "Redirecting..." }, { status: 302 });
}

export async function action({ request }: ActionFunctionArgs) {
  if (!shopify.login) {
    return json({ error: "Login not available" }, { status: 500 });
  }
  const result = await shopify.login(request);
  if (result instanceof Response) return result;
  if (result && typeof result === "object" && "shop" in result) {
    return json(result, { status: 400 });
  }
  return json({ message: "Redirecting..." }, { status: 302 });
}
