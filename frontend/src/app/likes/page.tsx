import LikesSwipeDeck from "@/components/likes-swipe-deck";
import { fetchLikedMeDeckAction } from "@/app/actions/auth";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LikesPage() {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get("session_user")?.value;

  if (!sessionUser) {
    redirect("/login");
  }

  const likedMeDeck = await fetchLikedMeDeckAction(sessionUser);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-400">
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-pink-500 text-white font-extrabold text-xl shadow-sm">
              💘
            </span>
            <span className="text-slate-600 font-semibold">Loading people who liked you...</span>
          </div>
        </div>
      }
    >
      <LikesSwipeDeck
        currentUser={sessionUser}
        likedMeDeck={likedMeDeck}
      />
    </Suspense>
  );
}
