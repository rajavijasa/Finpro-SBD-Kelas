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
  const [onlyMyNetwork, setOnlyMyNetwork] = useState(false);
  const [showSharedSparks, setShowSharedSparks] = useState(false);

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

  // 1. In-memory high speed reactive network filtering
  let filteredData = data || { nodes: [], links: [] };
  if (data && onlyMyNetwork) {
    const myNode = data.nodes.find(n => n.isMe || n.caption === userName);
    if (myNode) {
      const myId = myNode.id;
      const directConnectedIds = new Set<string>();
      directConnectedIds.add(myId);

      // Find direct links and connected nodes
      data.links.forEach(link => {
        const srcId = typeof link.source === 'object' ? (link.source as any).id : link.source;
        const tgtId = typeof link.target === 'object' ? (link.target as any).id : link.target;

        if (srcId === myId) {
          directConnectedIds.add(tgtId);
        } else if (tgtId === myId) {
          directConnectedIds.add(srcId);
        }
      });

      // Include 1-hop class-mates & hobby-mates if shared sparks is ticked
      const extendedConnectedIds = new Set<string>(directConnectedIds);
      if (showSharedSparks) {
        data.links.forEach(link => {
          const srcId = typeof link.source === 'object' ? (link.source as any).id : link.source;
          const tgtId = typeof link.target === 'object' ? (link.target as any).id : link.target;

          if (directConnectedIds.has(srcId)) {
            extendedConnectedIds.add(tgtId);
          }
          if (directConnectedIds.has(tgtId)) {
            extendedConnectedIds.add(srcId);
          }
        });
      }

      const filteredNodes = data.nodes.filter(n => extendedConnectedIds.has(n.id));
      const filteredLinks = data.links.filter(link => {
        const srcId = typeof link.source === 'object' ? (link.source as any).id : link.source;
        const tgtId = typeof link.target === 'object' ? (link.target as any).id : link.target;
        return extendedConnectedIds.has(srcId) && extendedConnectedIds.has(tgtId);
      });

      filteredData = {
        nodes: filteredNodes,
        links: filteredLinks
      };
    }
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
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // 4. Draw high-legibility dynamic text labels directly on canvas for core hub nodes
    const showText = isMe || type === 'Major' || (type === 'Hobby' && globalScale > 1.2) || globalScale > 2.0;
    if (showText) {
      const fontSize = isMe ? 13 / globalScale : 8.5 / globalScale;
      ctx.font = `${isMe ? 'bold' : '700'} ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textWidth = ctx.measureText(label).width;
      const bPad = 2;
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fillRect(
        node.x - textWidth / 2 - bPad, 
        node.y - size - fontSize - bPad * 2, 
        textWidth + bPad * 2, 
        fontSize + bPad * 2
      );
      
      ctx.fillStyle = isMe ? "#f43f5e" : "#1e293b";
      ctx.fillText(label, node.x, node.y - size - fontSize / 2 - 2);
    }
  };

  const canvasBgColor = isFullScreen ? "rgba(248, 250, 252, 1)" : "rgba(255, 255, 255, 1)";
  const wireColor = isFullScreen ? "rgba(148, 163, 184, 0.22)" : "rgba(148, 163, 184, 0.16)"; 
  const linkWidth = isFullScreen ? 0.6 : 0.5;

  return (
    <div className={`relative ${isFullScreen ? 'h-full w-full bg-slate-50' : 'h-[480px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm'}`}>
      
      {/* Floating Dynamic Legend overlay with contrast styling */}
      <div className={`absolute bottom-4 left-4 z-10 flex flex-wrap gap-2.5 backdrop-blur-sm p-3.5 rounded-xl border text-[10px] font-bold shadow-lg pointer-events-none bg-white/95 border-slate-200/80 text-slate-600`}>
        <div className="flex items-center gap-1.5 relative">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping absolute" />
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 relative" />
          <span className="text-rose-600">Active Spark (You)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
          <span>Student ({filteredData.nodes.filter(n => n.label === 'User').length})</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-md bg-purple-400 border border-slate-300" />
          <span>Major</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-md bg-emerald-400 border border-slate-300" />
          <span>Course</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-md bg-amber-400 border border-slate-300" />
          <span>Hobby</span>
        </div>
      </div>

      {/* Floating Dynamic Legend Filter Options (Glassmorphic) */}
      <div className={`absolute top-4 right-4 z-10 flex flex-col gap-2 p-3 rounded-xl border shadow-lg backdrop-blur-md max-w-[240px] select-none bg-white/90 border-slate-200/80 text-slate-800`}>
        <div className="flex items-center gap-1.5 border-b pb-1.5 mb-1 border-slate-200/20">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">Radar Filter Control</span>
        </div>
        
        <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold select-none group">
          <input
            type="checkbox"
            checked={onlyMyNetwork}
            onChange={(e) => {
              setOnlyMyNetwork(e.target.checked);
              if (!e.target.checked) setShowSharedSparks(false);
            }}
            className="mt-0.5 rounded border-slate-350 text-rose-650 focus:ring-rose-500 cursor-pointer accent-rose-500 h-3.5 w-3.5"
          />
          <div className="flex flex-col">
            <span>My Personal Orbit</span>
            <span className="text-[9px] text-slate-400 font-normal mt-0.5">Filter only my major, courses & hobbies</span>
          </div>
        </label>

        {onlyMyNetwork && (
          <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold select-none group border-t border-slate-200/10 pt-2 mt-1 animate-fadeIn">
            <input
              type="checkbox"
              checked={showSharedSparks}
              onChange={(e) => setShowSharedSparks(e.target.checked)}
              className="mt-0.5 rounded border-slate-350 text-rose-650 focus:ring-rose-500 cursor-pointer accent-rose-500 h-3.5 w-3.5"
            />
            <div className="flex flex-col">
              <span>Show Shared Sparks</span>
              <span className="text-[9px] text-slate-400 font-normal mt-0.5">Reveal other students in my class & hobby circles</span>
            </div>
          </label>
        )}
      </div>

      <ForceGraph2D
        graphData={filteredData}
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
