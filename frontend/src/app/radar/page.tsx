import { GraphDemo } from "@/components/graph-demo";
import { Suspense } from "react";
import { RadarHeader } from "./radar-header";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RadarPage() {
  // Read active authenticated session cookie from Supabase Postgres / Drizzle
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get("session_user")?.value;

  if (!sessionUser) {
    redirect("/login");
  }

  const userName = sessionUser;

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden relative select-none">
      
      {/* Sleek Translucent Floating Top Banner */}
      <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
        <RadarHeader currentUser={userName} />
      </Suspense>

      {/* Main Full-Screen Radar Canvas Area */}
      <div className="flex-1 w-full h-full relative">
        <GraphDemo userName={userName} isFullScreen={true} />
      </div>

    </div>
  );
}
