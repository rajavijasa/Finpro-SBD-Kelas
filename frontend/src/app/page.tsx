import CampusMatchDashboard from "@/components/campus-match-dashboard";
import { runCypher } from "@/lib/neo4j";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import {
  friendOfFriendRecommendations,
  hobbyCluster,
  mutualClassFinder,
} from "@/lib/recommendations";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    userName?: string;
    limit?: string;
  }>;
}

export default async function Home({ searchParams }: PageProps) {
  // Check active authenticated session cookie from Supabase Postgres / Drizzle
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get("session_user")?.value;

  if (!sessionUser) {
    redirect("/login");
  }

  const params = await searchParams;
  const userName = sessionUser;
  const limitRaw = Number(params.limit ?? process.env.DEMO_LIMIT ?? 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 10;

  // 1. Fetch active user profile from PostgreSQL & orbits from Neo4j in parallel
  const [profileResult, orbitsResult] = await Promise.all([
    db.select().from(users).where(eq(users.fullName, sessionUser)).limit(1),
    runCypher(`
      MATCH (s:Student {name: $sessionUser})
      OPTIONAL MATCH (s)-[:TAKES]->(c:Course)
      OPTIONAL MATCH (s)-[:LIKES]->(h:Hobby)
      RETURN collect(DISTINCT c.code) AS courses, collect(DISTINCT h.name) AS hobbies
    `, { sessionUser })
  ]);

  const rawProfile = profileResult[0];

  // Extract and build full profileData prop
  const coursesList: string[] = orbitsResult.records[0]?.get('courses') || [];
  const hobbiesList: string[] = orbitsResult.records[0]?.get('hobbies') || [];

  const profileData = {
    fullName: rawProfile?.fullName || sessionUser,
    username: rawProfile?.username || '',
    phone: rawProfile?.phone || '',
    university: rawProfile?.university || 'Campus Circle University',
    major: rawProfile?.major || 'Information Systems',
    year: rawProfile?.year || 2,
    bio: rawProfile?.bio || '',
    gender: rawProfile?.gender || 'female',
    avatarUrl: rawProfile?.avatarUrl || '',
    courses: coursesList,
    hobbies: hobbiesList,
  };

  // 2. Fetch recommendations in parallel (hobbyCluster uses the updated dynamic shared hobby matcher)
  const [mutual, fof, hobby, allUsersRes] = await Promise.allSettled([
    mutualClassFinder({ userName, limit }),
    friendOfFriendRecommendations({ userName, limit }),
    hobbyCluster({ userName, limit }),
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
        mutualMatches={mutualVal}
        fofMatches={fofVal}
        hobbyMatches={hobbyVal}
        allUsers={allUsers}
        profileData={profileData}
      />
    </Suspense>
  );
}
