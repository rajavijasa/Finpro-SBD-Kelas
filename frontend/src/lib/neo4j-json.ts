import neo4j from 'neo4j-driver';

export function neo4jToNative(value: unknown): unknown {
  if (neo4j.isInt(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(neo4jToNative);
  if (value && typeof value === 'object') {
    if (value instanceof Date) return value.toISOString();
    const record: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      record[key] = neo4jToNative(val);
    }
    return record;
  }
  return value;
}

export function neo4jRecordToNative<T>(value: T): T {
  return neo4jToNative(value) as T;
}
