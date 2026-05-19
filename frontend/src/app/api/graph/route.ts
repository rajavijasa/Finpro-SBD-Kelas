import neo4j, { type Node, type Path, type Relationship } from 'neo4j-driver';
import { NextResponse } from 'next/server';
import { getNeo4jDriver, runCypher } from '@/lib/neo4j';
import { neo4jToNative } from '@/lib/neo4j-json';
import { getErrorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

type GraphNode = {
  id: string;
  label: string;
  caption: string;
};

type GraphLink = {
  id: string;
  source: string;
  target: string;
  type: string;
};

function primaryLabel(labels: string[]): string {
  return labels[0] ?? 'Node';
}

function captionForNode(label: string, props: Record<string, unknown>): string {
  const asString = (v: unknown) => (v === null || v === undefined ? undefined : String(v));
  const name = asString(props.name);
  const code = asString(props.code);
  const subject = asString(props.subject);

  if (label === 'User') return name ?? 'User';
  if (label === 'Course') return code ?? subject ?? 'Course';
  if (label === 'Major') return name ?? 'Major';
  if (label === 'Hobby') return name ?? 'Hobby';
  return name ?? label;
}

function nodeToGraphNode(node: Node): GraphNode {
  const props = neo4jToNative(node.properties) as Record<string, unknown>;
  const label = primaryLabel(node.labels);
  return {
    id: node.elementId,
    label,
    caption: captionForNode(label, props),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userName = searchParams.get('userName');
  const limitPathsRaw = Number(searchParams.get('limitPaths') ?? 120);
  const limitPathsNormalized = Number.isFinite(limitPathsRaw) ? limitPathsRaw : 120;
  const limitPaths = Math.max(1, Math.min(300, limitPathsNormalized));

  if (!userName) {
    return NextResponse.json({ error: 'Missing query param: userName' }, { status: 400 });
  }

  try {
    // Validate env early (helps give a clear error instead of partial graph)
    getNeo4jDriver();

    const meRes = await runCypher(
      `
        MATCH (me:User|Student {name: $userName})
        WITH me, COUNT { (me)--() } AS meDegree
        ORDER BY meDegree DESC
        LIMIT 1
        RETURN me
      `,
      { userName },
    );

    if (meRes.records.length === 0) {
      return NextResponse.json(
        { error: `User not found: ${userName}` },
        { status: 404 },
      );
    }

    const meNode = meRes.records[0].get('me') as Node;

    const pathsRes = await runCypher(
      `
        MATCH (me:User|Student {name: $userName})
        WITH me, COUNT { (me)--() } AS meDegree
        ORDER BY meDegree DESC
        LIMIT 1

        MATCH p=(me)-[:CONNECTED_WITH|TAKES|STUDIES|LIKES*1..2]-(n)
        RETURN p
        LIMIT $limitPaths
      `,
      { userName, limitPaths: neo4j.int(limitPaths) },
    );

    const nodeMap = new Map<string, GraphNode>();
    const linkMap = new Map<string, GraphLink>();

    const upsertNode = (n: Node) => {
      if (!nodeMap.has(n.elementId)) nodeMap.set(n.elementId, nodeToGraphNode(n));
    };

    const upsertLink = (
      rel: Relationship,
      start: Node,
      end: Node,
    ) => {
      if (linkMap.has(rel.elementId)) return;
      linkMap.set(rel.elementId, {
        id: rel.elementId,
        source: start.elementId,
        target: end.elementId,
        type: rel.type,
      });
    };

    upsertNode(meNode);

    for (const record of pathsRes.records) {
      const p = record.get('p') as Path;
      for (const s of p.segments) {
        upsertNode(s.start);
        upsertNode(s.end);
        upsertLink(s.relationship, s.start, s.end);
      }
    }

    return NextResponse.json({
      nodes: Array.from(nodeMap.values()),
      links: Array.from(linkMap.values()),
    });
  } catch (err) {
    console.error('graph failed', err);
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Neo4j query failed'
        : getErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
