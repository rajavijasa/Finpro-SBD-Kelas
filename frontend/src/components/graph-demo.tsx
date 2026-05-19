'use client';

import dynamic from 'next/dynamic';
import { use, useMemo } from 'react';
import { getErrorMessage } from '@/lib/errors';

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

type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

type GraphResult =
  | { ok: true; data: GraphData }
  | { ok: false; error: string };

const ForceGraph2D = dynamic(
  () => import('react-force-graph').then((m) => m.ForceGraph2D),
  { ssr: false },
);

function extractError(json: unknown): string | undefined {
  if (typeof json !== 'object' || json === null) return undefined;
  if (!('error' in json)) return undefined;
  const err = (json as { error?: unknown }).error;
  return typeof err === 'string' ? err : undefined;
}

async function loadGraph(url: string): Promise<GraphResult> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        ok: false,
        error: extractError(json) ?? `Request failed: ${res.status}`,
      };
    }

    if (
      typeof json !== 'object' ||
      json === null ||
      !('nodes' in json) ||
      !('links' in json)
    ) {
      return { ok: false, error: 'Invalid graph response' };
    }

    return { ok: true, data: json as GraphData };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export function GraphDemo({ userName }: { userName: string }) {
  const url = useMemo(() => {
    const params = new URLSearchParams({ userName });
    return `/api/graph?${params.toString()}`;
  }, [userName]);

  const promise = useMemo(() => loadGraph(url), [url]);
  const result = use(promise);

  if (!result.ok) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
        Graph error: {result.error}
      </div>
    );
  }

  const nodeLabel = (n: unknown) => {
    const node = n as Partial<GraphNode>;
    return `${node.label ?? 'Node'}: ${node.caption ?? ''}`;
  };

  const linkLabel = (l: unknown) => {
    const link = l as Partial<GraphLink>;
    return link.type ?? 'REL';
  };

  return (
    <div className="h-[420px] overflow-hidden rounded-lg border border-slate-200">
      <ForceGraph2D
        graphData={result.data}
        nodeId="id"
        nodeLabel={nodeLabel}
        nodeAutoColorBy="label"
        linkLabel={linkLabel}
        linkAutoColorBy="type"
      />
    </div>
  );
}
