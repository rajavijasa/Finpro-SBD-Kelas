import 'server-only';

import neo4j, { type Driver } from 'neo4j-driver';

declare global {
  var __campuscircleNeo4jDriver: Driver | undefined;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getNeo4jDriver(): Driver {
  if (globalThis.__campuscircleNeo4jDriver) return globalThis.__campuscircleNeo4jDriver;

  const uri = requiredEnv('NEO4J_URI');
  const username = requiredEnv('NEO4J_USERNAME');
  const password = requiredEnv('NEO4J_PASSWORD');

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  globalThis.__campuscircleNeo4jDriver = driver;
  return driver;
}

export async function runCypher<T = unknown>(
  cypher: string,
  params: Record<string, unknown> = {},
): Promise<neo4j.QueryResult<T>> {
  const driver = getNeo4jDriver();
  const database = process.env.NEO4J_DATABASE;
  const session = driver.session({ database: database || undefined });

  try {
    return await session.run<T>(cypher, params);
  } finally {
    await session.close();
  }
}
