import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from './generated/prisma';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makePrisma() {
  // Local dev: DATABASE_URL=file:./dev.db (no token).
  // Production (Turso): DATABASE_URL=libsql://<db>.turso.io + TURSO_AUTH_TOKEN.
  // Same adapter either way - going to the cloud is an env change, not a code change.
  const url = process.env.DATABASE_URL;
  // A file DB on a serverless host silently loses every order on redeploy.
  // Enforced only on serverless platforms so local production builds still work.
  if (process.env.VERCEL && (!url || url.startsWith('file:'))) {
    throw new Error('DATABASE_URL must point at a persistent database (libsql://...) on Vercel');
  }
  const adapter = new PrismaLibSql({
    url: url ?? 'file:./dev.db',
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
