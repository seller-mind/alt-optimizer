import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;
try {
  prisma = globalThis.__prisma ?? new PrismaClient();
  globalThis.__prisma = prisma;
} catch (error) {
  console.error("[AltOptimizer] PrismaClient initialization failed:", error);
  prisma = null as unknown as PrismaClient;
}

export default prisma;
