import { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import shopify from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await shopify.authenticate.admin(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  await shopify.authenticate.admin(request);
  return null;
}
