import { createRequestHandler } from "@remix-run/node";
import type { ServerBuild } from "@remix-run/node";

let handler: ReturnType<typeof createRequestHandler>;

export default async function handleRequest(request: Request) {
  if (!handler) {
    // Dynamic import ensures the build is loaded at runtime, not compile time
    // This avoids issues with the build artifact not existing yet during Vercel's build phase
    const build = (await import(
      "../build/server/index.js"
    )) as unknown as ServerBuild;
    handler = createRequestHandler(build);
  }
  return handler(request);
}