import CampusMatchDashboard from "@/components/campus-match-dashboard";
import { runCypher } from "@/lib/neo4j";
import {
  friendOfFriendRecommendations,
  hobbyCluster,
  mutualClassFinder,
} from "@/lib/recommendations";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    userName?: string;
    hobbyName?: string;
    limit?: string;
  }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const userName = params.userName ?? process.env.DEMO_USER_NAME ?? "Alice";
  const hobbyName = params.hobbyName ?? process.env.DEMO_HOBBY_NAME ?? "Gaming";
  const limitRaw = Number(params.limit ?? process.env.DEMO_LIMIT ?? 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 10;

  // 1. Fetch recommendations in parallel
  const [mutual, fof, hobby, allUsersRes] = await Promise.allSettled([
    mutualClassFinder({ userName, limit }),
    friendOfFriendRecommendations({ userName, limit }),
    hobbyCluster({ userName, hobbyName, limit }),
    runCypher(`
      MATCH (u:User|Student)
      RETURN u.name AS name
      ORDER BY u.name ASC
      LIMIT 80
    `)
  ]);

  const mutualVal = mutual.status === "fulfilled" ? mutual.value : [];
  const fofVal = fof.status === "fulfilled" ? fof.value : [];
  const hobbyVal = hobby.status === "fulfilled" ? hobby.value : [];
  
  // Parse all loaded user names from the database
  let allUsers: string[] = [];
  if (allUsersRes.status === "fulfilled") {
    allUsers = allUsersRes.value.records.map(r => r.get("name") as string);
  }

  // Fallback to core default names if DB is temporarily unreachable
  if (allUsers.length === 0) {
    allUsers = ["Alice", "Bob", "Carol", "Dave", "Erin", "Frank"];
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-400">
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-500 text-white font-extrabold text-xl shadow-sm">
              C
            </span>
            <span className="text-slate-600 font-semibold">Loading CampusCircle Spark Space...</span>
          </div>
        </div>
      }
    >
      <CampusMatchDashboard
        currentUser={userName}
        currentHobby={hobbyName}
        mutualMatches={mutualVal}
        fofMatches={fofVal}
        hobbyMatches={hobbyVal}
        allUsers={allUsers}
      />
    </Suspense>
  );
}
