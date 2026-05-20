import { GraphDemo } from "@/components/graph-demo";
import { runCypher } from "@/lib/neo4j";
import Link from "next/link";
import { Suspense } from "react";
import { RadarHeader } from "./radar-header";

export const dynamic = "force-dynamic";

interface RadarPageProps {
  searchParams: Promise<{
    userName?: string;
  }>;
}

export default async function RadarPage({ searchParams }: RadarPageProps) {
  const params = await searchParams;
  const userName = params.userName ?? "Alice";

  // Load all user names from database for the dynamic profile switcher
  const allUsersRes = await runCypher(`
    MATCH (u:User|Student)
    RETURN u.name AS name
    ORDER BY u.name ASC
    LIMIT 80
  `).catch(() => null);

  let allUsers: string[] = [];
  if (allUsersRes) {
    allUsers = allUsersRes.records.map(r => r.get("name") as string);
  }
  if (allUsers.length === 0) {
    allUsers = ["Alice", "Bob", "Carol", "Dave", "Erin", "Frank"];
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative select-none">
      
      {/* Sleek Translucent Floating Top Banner */}
      <Suspense fallback={<div className="h-16 bg-slate-950 border-b border-slate-800" />}>
        <RadarHeader currentUser={userName} allUsers={allUsers} />
      </Suspense>

      {/* Main Full-Screen Radar Canvas Area */}
      <div className="flex-1 w-full h-full relative">
        <GraphDemo userName={userName} isFullScreen={true} />
      </div>

    </div>
  );
}
