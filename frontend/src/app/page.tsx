import CampusMatchDashboard from "@/components/campus-match-dashboard";
import { runCypher } from "@/lib/neo4j";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import {
  friendOfFriendRecommendations,
  hobbyCluster,
  mutualClassFinder,
} from "@/lib/recommendations";
import { fetchSwipeDeckAction, fetchLikedMeDeckAction } from "@/app/actions/auth";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Check active authenticated session cookie from Supabase Postgres / Drizzle
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get("session_user")?.value;

  if (!sessionUser) {
    redirect("/login");
  }

  const userName = sessionUser;

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

  // 2. Fetch recommendations (for Radar panel) + swipe deck + liked-me count in parallel
  const [mutual, fof, hobby, swipeDeckResult, likedMeResult] = await Promise.allSettled([
    mutualClassFinder({ userName, limit: 50 }),
    friendOfFriendRecommendations({ userName, limit: 50 }),
    hobbyCluster({ userName, limit: 50 }),
    fetchSwipeDeckAction(sessionUser),
    fetchLikedMeDeckAction(sessionUser),
  ]);

  const mutualVal = mutual.status === "fulfilled" ? mutual.value : [];
  const fofVal = fof.status === "fulfilled" ? fof.value : [];
  const hobbyVal = hobby.status === "fulfilled" ? hobby.value : [];
  const swipeDeck = swipeDeckResult.status === "fulfilled" ? swipeDeckResult.value : [];
  const likedMeDeck = likedMeResult.status === "fulfilled" ? likedMeResult.value : [];

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
        swipeDeck={swipeDeck}
        likedMeCount={likedMeDeck.length}
        profileData={profileData}
      />
    </Suspense>
  );
}
