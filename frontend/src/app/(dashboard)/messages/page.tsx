import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MessagesInbox from '@/components/messages-inbox';
import Navbar from '@/components/navbar';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('session_user')?.value;

  if (!sessionUser) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar currentUser={sessionUser} activeTab="messages" />


      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <MessagesInbox currentUser={sessionUser} />
      </main>
    </div>
  );
}
