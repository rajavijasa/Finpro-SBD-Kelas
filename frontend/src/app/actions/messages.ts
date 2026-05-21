'use server';

import { db, messages, users } from '@/db';
import { getErrorMessage } from '@/lib/errors';
import { runCypher } from '@/lib/neo4j';
import { and, desc, eq, inArray, or } from 'drizzle-orm';

export type MatchSummary = {
  name: string;
  avatarUrl: string | null;
};

export type ChatMessage = {
  id: number;
  direction: 'in' | 'out';
  content: string;
  createdAt: string;
};

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toString' in value) return String(value);
  return new Date().toISOString();
}

async function resolveUserIdByName(fullName: string): Promise<number | null> {
  const row = await db.select({ id: users.id }).from(users).where(eq(users.fullName, fullName)).limit(1);
  return row[0]?.id ?? null;
}

export async function getMatchesAction(currentUser: string): Promise<{ matches: MatchSummary[] } | { error: string }> {
  try {
    const result = await runCypher(
      `
      MATCH (me:Student|User {name: $name})-[:MATCHES]->(other:Student|User)
      RETURN DISTINCT other.name AS name
      ORDER BY name ASC
      `,
      { name: currentUser },
    );

    const names = result.records
      .map((r) => r.get('name'))
      .filter((v): v is string => typeof v === 'string' && v.length > 0);

    if (names.length === 0) return { matches: [] };

    const rows = await db
      .select({ fullName: users.fullName, avatarUrl: users.avatarUrl })
      .from(users)
      .where(inArray(users.fullName, names));

    const avatarByName = new Map(rows.map((r) => [r.fullName, r.avatarUrl] as const));

    return {
      matches: names.map((name) => ({
        name,
        avatarUrl: avatarByName.get(name) ?? null,
      })),
    };
  } catch (err) {
    console.error('getMatchesAction Failed:', err);
    return { error: getErrorMessage(err) };
  }
}

export async function getConversationAction(
  currentUser: string,
  targetName: string,
  limit = 120,
): Promise<{ messages: ChatMessage[] } | { error: string }> {
  try {
    const meId = await resolveUserIdByName(currentUser);
    const otherId = await resolveUserIdByName(targetName);

    if (!meId || !otherId) {
      return { error: 'Users not found in PostgreSQL. Run sync or register both users first.' };
    }

    const rows = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, meId), eq(messages.receiverId, otherId)),
          and(eq(messages.senderId, otherId), eq(messages.receiverId, meId)),
        ),
      )
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(limit);

    const ordered = [...rows].reverse();

    return {
      messages: ordered.map((m) => ({
        id: m.id,
        direction: m.senderId === meId ? 'out' : 'in',
        content: m.content,
        createdAt: toIso(m.createdAt),
      })),
    };
  } catch (err) {
    console.error('getConversationAction Failed:', err);
    return { error: getErrorMessage(err) };
  }
}

export async function sendMessageAction(
  currentUser: string,
  targetName: string,
  content: string,
): Promise<{ message: ChatMessage } | { error: string }> {
  try {
    const trimmed = content.trim();
    if (!trimmed) return { error: 'Message cannot be empty.' };

    // Enforce match-only messaging
    const matchCheck = await runCypher(
      `
      MATCH (me:Student|User {name: $me})-[:MATCHES]->(other:Student|User {name: $other})
      RETURN count(other) > 0 AS ok
      `,
      { me: currentUser, other: targetName },
    );
    const ok = matchCheck.records[0]?.get('ok');
    if (ok !== true) {
      return { error: 'You can only message users you have matched with.' };
    }

    const meId = await resolveUserIdByName(currentUser);
    const otherId = await resolveUserIdByName(targetName);

    if (!meId || !otherId) {
      return { error: 'Users not found in PostgreSQL. Run sync or register both users first.' };
    }

    const inserted = await db
      .insert(messages)
      .values({
        senderId: meId,
        receiverId: otherId,
        content: trimmed,
      })
      .returning({
        id: messages.id,
        createdAt: messages.createdAt,
      });

    const row = inserted[0];
    if (!row) return { error: 'Failed to insert message.' };

    return {
      message: {
        id: row.id,
        direction: 'out',
        content: trimmed,
        createdAt: toIso(row.createdAt),
      },
    };
  } catch (err) {
    console.error('sendMessageAction Failed:', err);
    return { error: getErrorMessage(err) };
  }
}
