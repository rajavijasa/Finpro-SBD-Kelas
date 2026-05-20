import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing inside .env.local!");
}

// Disable prefetch as it is not supported for Transaction Pool Mode in Supabase Pooler (Port 6543)
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
export * from './schema';
