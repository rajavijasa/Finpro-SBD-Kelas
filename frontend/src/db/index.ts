import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder";

// Disable prefetch as it is not supported for Transaction Pool Mode in Supabase Pooler (Port 6543)
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
export * from './schema';
