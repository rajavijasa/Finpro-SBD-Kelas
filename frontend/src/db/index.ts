import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type SqlClient = ReturnType<typeof postgres>;

const connectionString = process.env.DATABASE_URL;

// Disable prefetch as it is not supported for Transaction Pool Mode in Supabase Pooler (Port 6543)
const client: SqlClient = connectionString
	? postgres(connectionString, { prepare: false })
	: ((() => {
			throw new Error(
				'DATABASE_URL is missing. Create frontend/.env.local (copy from .env.example) and set DATABASE_URL, then run: node scripts/drizzle-push.mjs'
			);
		}) as unknown as SqlClient);
export const db = drizzle(client, { schema });
export * from './schema';
