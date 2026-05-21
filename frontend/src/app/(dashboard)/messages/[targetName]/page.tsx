import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MessagesInbox from '@/components/messages-inbox';
import Navbar from '@/components/navbar';

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
      <Navbar currentUser={sessionUser} activeTab="messages" />


      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <MessagesInbox currentUser={sessionUser} initialTargetName={targetName} />
      </main>
    </div>
  );
}
