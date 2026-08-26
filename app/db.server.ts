import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

if (!global.__prisma) {
  global.__prisma = new PrismaClient();
}

const prisma = global.__prisma;

// Auto-create tables on first import (development/safe mode)
if (process.env.NODE_ENV !== "production") {
  prisma.$connect().catch((err) => {
    console.error("[Prisma] Connection failed:", err.message);
  });
}

export default prisma;
