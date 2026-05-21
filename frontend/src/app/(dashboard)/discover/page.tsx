import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DiscoverRecommendations from '@/components/discover-recommendations';
import Navbar from '@/components/navbar';

export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('session_user')?.value;

  if (!sessionUser) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar currentUser={sessionUser} activeTab="discover" />


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
