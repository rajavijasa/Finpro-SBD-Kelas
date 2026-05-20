import neo4j, { type Node, type Relationship } from 'neo4j-driver';
import { NextResponse } from 'next/server';
import { getNeo4jDriver, runCypher } from '@/lib/neo4j';
import { neo4jToNative } from '@/lib/neo4j-json';
import { getErrorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

type GraphNode = {
  id: string;
  label: string;
  caption: string;
  isMe?: boolean;
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

  if (label === 'User' || label === 'Student') return name ?? 'User';
  if (label === 'Course') return code ?? subject ?? 'Course';
  if (label === 'Major') return name ?? 'Major';
  if (label === 'Hobby') return name ?? 'Hobby';
  return name ?? label;
}

function nodeToGraphNode(node: Node, meElementId?: string): GraphNode {
  const props = neo4jToNative(node.properties) as Record<string, unknown>;
  let label = primaryLabel(node.labels);
  if (label === 'Student') {
    label = 'User';
  }
  return {
    id: node.elementId,
    label,
    caption: captionForNode(label, props),
    isMe: meElementId ? node.elementId === meElementId : false,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userName = searchParams.get('userName') ?? 'Alice';

  try {
    // Validate driver connection
    getNeo4jDriver();

    // 1. Fetch current active user node to track and highlight
    const meRes = await runCypher(
      `
        MATCH (me:User|Student {name: $userName})
        RETURN me
        LIMIT 1
      `,
      { userName },
    );

    let meNode: Node | null = null;
    if (meRes.records.length > 0) {
      meNode = meRes.records[0].get('me') as Node;
    }

    // 2. Fetch the ENTIRE global cosmic university network (All nodes that have active relationships)
    // By matching all relationships directly, we guarantee 0 floating disconnected nodes that break the force camera bounds!
    const globalRes = await runCypher(
      `
        MATCH (n1)-[r:CONNECTED_WITH|TAKES|STUDIES|LIKES]->(n2)
        RETURN n1, r, n2
      `,
    );

    const nodeMap = new Map<string, GraphNode>();
    const linkMap = new Map<string, GraphLink>();

    const meId = meNode?.elementId;

    const upsertNode = (n: Node) => {
      if (!nodeMap.has(n.elementId)) {
        nodeMap.set(n.elementId, nodeToGraphNode(n, meId));
      }
    };

    const upsertLink = (
      rel: Relationship,
      startId: string,
      endId: string,
    ) => {
      if (linkMap.has(rel.elementId)) return;
      linkMap.set(rel.elementId, {
        id: rel.elementId,
        source: startId,
        target: endId,
        type: rel.type,
      });
    };

    // Process all global connections
    for (const record of globalRes.records) {
      const n1 = record.get('n1') as Node;
      const r = record.get('r') as Relationship;
      const n2 = record.get('n2') as Node;

      upsertNode(n1);
      upsertNode(n2);
      upsertLink(r, n1.elementId, n2.elementId);
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
