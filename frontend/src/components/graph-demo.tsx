'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
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
  () => import('react-force-graph-2d'),
  { ssr: false },
);

export function GraphDemo({ userName }: { userName: string }) {
  const [data, setData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ userName });
    const url = `/api/graph?${params.toString()}`;

    fetch(url)
      .then(async (res) => {
        const json: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            json && typeof json === 'object' && 'error' in json && typeof json.error === 'string'
              ? json.error
              : `Request failed: ${res.status}`
          );
        }
        if (
          typeof json !== 'object' ||
          json === null ||
          !('nodes' in json) ||
          !('links' in json)
        ) {
          throw new Error('Invalid graph response');
        }
        return json as GraphData;
      })
      .then((data) => {
        if (active) {
          setData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userName]);

  if (loading) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600 animate-pulse">
        Loading graph...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
        Graph error: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600">
        No data available
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
        graphData={data}
        nodeId="id"
        nodeLabel={nodeLabel}
        nodeAutoColorBy="label"
        linkLabel={linkLabel}
        linkAutoColorBy="type"
      />
    </div>
  );
}
