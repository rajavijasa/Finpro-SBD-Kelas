import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type SqlClient = ReturnType<typeof postgres>;

const connectionString = process.env.DATABASE_URL;

// Use placeholder connection string if DATABASE_URL is missing to avoid Drizzle initialization crash at build time.
// Disable prefetch as it is not supported for Transaction Pool Mode in Supabase Pooler (Port 6543)
const client: SqlClient = postgres(
	connectionString || 'postgresql://postgres:placeholder@localhost:5432/postgres',
	{ prepare: false }
);

export const db = drizzle(client, { schema });
export * from './schema';

