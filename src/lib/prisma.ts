import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const linuxEnginePath = path.join(process.cwd(), "libquery_engine-debian-openssl-1.1.x.so.node");
if (
  process.platform === "linux" &&
  fs.existsSync(linuxEnginePath) &&
  !process.env.PRISMA_QUERY_ENGINE_LIBRARY
) {
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = linuxEnginePath;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
