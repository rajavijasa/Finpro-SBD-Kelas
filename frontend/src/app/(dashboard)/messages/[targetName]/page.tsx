import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MessagesInbox from '@/components/messages-inbox';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { targetName: string };
};

export default async function MessageThreadPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('session_user')?.value;

  if (!sessionUser) {
    redirect('/login');
  }

  const raw = params.targetName;
  let targetName = raw;
  try {
    targetName = decodeURIComponent(raw);
  } catch {
    // keep raw
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-white font-black text-sm shadow-sm">
              C
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold tracking-tight">CampusCircle</span>
              <span className="text-[10px] font-bold text-sky-700 tracking-wider uppercase bg-sky-500/10 px-2 py-0.5 rounded">
                Messages
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-rose-50 border border-rose-100/80 px-3.5 py-2 rounded-xl text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-500">Active:</span>
            <span className="text-slate-900 font-black">{sessionUser}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <MessagesInbox currentUser={sessionUser} initialTargetName={targetName} />
      </main>
    </div>
  );
}
