// Prisma Client Singleton (PostgreSQL)
// Đảm bảo chỉ tạo một instance duy nhất trong development (hot-reload)

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Try multiple environment variable names that Neon/Vercel might use
  const databaseUrl = process.env.DATABASE_URL || 
                      process.env.POSTGRES_URL || 
                      process.env.DATABASE_POSTGRES_URL ||
                      process.env.DATABASE_POSTGRES_PRISMA_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  console.log('Database URL prefix:', databaseUrl.substring(0, 30));
  
  const pool = new pg.Pool({ 
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
