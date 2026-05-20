import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DiscoverRecommendations from '@/components/discover-recommendations';

export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('session_user')?.value;

  if (!sessionUser) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-white font-black text-sm shadow-sm">
              C
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold tracking-tight">CampusCircle</span>
              <span className="text-[10px] font-bold text-rose-600 tracking-wider uppercase bg-rose-500/10 px-2 py-0.5 rounded">
                Discover
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 bg-rose-50 border border-rose-100/80 px-3.5 py-2 rounded-xl text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-500">Active:</span>
            <span className="text-slate-900 font-black">{sessionUser}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Recommendations Discovery
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Explore Neo4j-powered recommendations. Tap <strong>Connect</strong> to swipe right.
          </p>
        </div>

        <div className="mt-8">
          <DiscoverRecommendations currentUser={sessionUser} />
        </div>
      </main>
    </div>
  );
}
