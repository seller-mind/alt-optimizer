import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import shopify from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // GET /auth/login - SDK returns {} for form display, or throws redirect if shop param exists
  const errors = await shopify.login(request);
  return json({ errors });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // POST /auth/login - validates shop and initiates OAuth redirect
  const errors = await shopify.login(request);
  return json({ errors });
};

export default function AuthLogin() {
  return null; // SDK handles redirect; if we get here, show minimal fallback
}
