'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { getErrorMessage } from '@/lib/errors';

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

type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d'),
  { ssr: false },
);

export function GraphDemo({ userName, isFullScreen = false }: { userName: string; isFullScreen?: boolean }) {
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
      <div className={`flex items-center justify-center bg-slate-950 text-slate-400 ${isFullScreen ? 'h-full w-full' : 'h-[480px] rounded-2xl border border-slate-200/80'}`}>
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest animate-pulse">Initializing Scanner Radar</span>
          <span className="text-slate-300 font-semibold text-sm animate-pulse">Mapping all 1000+ student orbits & connections...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${isFullScreen ? 'h-full w-full bg-slate-950 flex items-center justify-center' : 'rounded-2xl border border-rose-200 bg-rose-50'}`}>
        <div className="max-w-md bg-rose-950/20 border border-rose-800/40 p-4 rounded-xl text-rose-200 text-sm">
          <span className="font-bold text-rose-400">Graph Database Link Error:</span> {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`flex items-center justify-center bg-slate-950 text-slate-500 ${isFullScreen ? 'h-full w-full' : 'h-[480px] rounded-2xl border border-slate-200'}`}>
        No campus social data mapped
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

  // HIGH VISIBILITY Custom Drawing Engine for dark cosmic and light themes
  const drawNodeCanvas = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.caption;
    const isMe = node.isMe;
    const type = node.label; // 'User' (Student), 'Major', 'Hobby', 'Course'
    
    // Significantly increased node sizes for outstanding high visibility
    let size = isFullScreen ? 4.5 : 4.0;
    let color = "#94a3b8"; // default slate
    
    if (type === 'User') {
      size = isMe ? 12.0 : (isFullScreen ? 4.2 : 3.8);
      // Bright neon cyan for students (extremely high contrast on slate-950)
      color = isMe ? "#f43f5e" : (isFullScreen ? "#38bdf8" : "#2563eb"); 
    } else if (type === 'Major') {
      size = isFullScreen ? 8.5 : 8.0;
      color = isFullScreen ? "#c084fc" : "#7c3aed"; // Glowing violet
    } else if (type === 'Course') {
      size = isFullScreen ? 7.2 : 6.8;
      color = isFullScreen ? "#34d399" : "#059669"; // Glowing emerald
    } else if (type === 'Hobby') {
      size = isFullScreen ? 7.2 : 6.8;
      color = isFullScreen ? "#fbbf24" : "#d97706"; // Glowing amber
    }

    // 1. Draw glowing outer rings for highlighted active profile node (pulsating star halo)
    if (isMe) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 8, 0, 2 * Math.PI, false);
      ctx.fillStyle = "rgba(244, 63, 94, 0.2)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI, false);
      ctx.fillStyle = "rgba(244, 63, 94, 0.4)";
      ctx.fill();
    }

    // 2. Draw solid node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    // 3. Draw clean premium borders
    if (isMe) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = isFullScreen ? "rgba(2, 6, 23, 0.9)" : "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // 4. Draw high-legibility dynamic text labels directly on canvas for core hub nodes
    // Render labels at lower zoom levels for even higher legibility
    const showText = isMe || type === 'Major' || (type === 'Hobby' && globalScale > 1.2) || globalScale > 2.0;
    if (showText) {
      const fontSize = isMe ? 13 / globalScale : 8.5 / globalScale;
      ctx.font = `${isMe ? 'bold' : '700'} ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textWidth = ctx.measureText(label).width;
      const bPad = 2;
      
      // Dynamic opaque backgrounds behind text to maximize contrast
      ctx.fillStyle = isFullScreen ? "rgba(2, 6, 23, 0.92)" : "rgba(255, 255, 255, 0.95)";
      ctx.fillRect(
        node.x - textWidth / 2 - bPad, 
        node.y - size - fontSize - bPad * 2, 
        textWidth + bPad * 2, 
        fontSize + bPad * 2
      );
      
      // Text Fill
      ctx.fillStyle = isMe ? "#f43f5e" : (isFullScreen ? "#e2e8f0" : "#1e293b");
      ctx.fillText(label, node.x, node.y - size - fontSize / 2 - 2);
    }
  };

  // High contrast backgrounds & robust link opacity
  const canvasBgColor = isFullScreen ? "rgba(2, 6, 23, 1)" : "rgba(255, 255, 255, 1)";
  
  // Significantly increased link opacity (0.08 on dark, 0.16 on light) so connections are beautifully clear
  const wireColor = isFullScreen ? "rgba(56, 189, 248, 0.08)" : "rgba(148, 163, 184, 0.16)"; 
  const linkWidth = isFullScreen ? 0.6 : 0.5;

  return (
    <div className={`relative ${isFullScreen ? 'h-full w-full bg-slate-950' : 'h-[480px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm'}`}>
      
      {/* Floating Dynamic Legend overlay with contrast styling */}
      <div className={`absolute bottom-4 left-4 z-10 flex flex-wrap gap-2.5 backdrop-blur-sm p-3.5 rounded-xl border text-[10px] font-bold shadow-lg pointer-events-none ${isFullScreen ? 'bg-slate-900/95 border-slate-800/80 text-slate-300' : 'bg-white/95 border-slate-200/80 text-slate-600'}`}>
        <div className="flex items-center gap-1.5 relative">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping absolute" />
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 relative" />
          <span className={isFullScreen ? 'text-rose-400' : 'text-rose-600'}>Active Spark (You)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`h-2.5 w-2.5 rounded-full ${isFullScreen ? 'bg-sky-400' : 'bg-blue-600'}`} />
          <span>Student ({data.nodes.filter(n => n.label === 'User').length})</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-md bg-purple-400 border border-slate-850" />
          <span>Major</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-md bg-emerald-400 border border-slate-850" />
          <span>Course</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-md bg-amber-400 border border-slate-850" />
          <span>Hobby</span>
        </div>
      </div>

      <ForceGraph2D
        graphData={data}
        nodeId="id"
        nodeLabel={nodeLabel}
        linkLabel={linkLabel}
        nodeCanvasObject={drawNodeCanvas}
        linkColor={() => wireColor}
        linkWidth={linkWidth}
        backgroundColor={canvasBgColor}
        cooldownTicks={isFullScreen ? 240 : 180} // longer cooling period to allow nodes to spread perfectly
      />
    </div>
  );
}
