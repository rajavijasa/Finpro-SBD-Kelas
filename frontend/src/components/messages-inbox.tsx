'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConversationAction, getMatchesAction, sendMessageAction, type ChatMessage, type MatchSummary } from '@/app/actions/messages';
import { getErrorMessage } from '@/lib/errors';

type Loadable<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: T; error: null }
  | { status: 'error'; data: T | null; error: string };

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessagesInbox({
  currentUser,
  initialTargetName,
}: {
  currentUser: string;
  initialTargetName?: string | null;
}) {
  const router = useRouter();
  const [matches, setMatches] = useState<Loadable<MatchSummary[]>>({ status: 'loading', data: null, error: null });
  const [selected, setSelected] = useState<string | null>(initialTargetName ?? null);
  const [thread, setThread] = useState<Loadable<ChatMessage[]>>({ status: 'loading', data: null, error: null });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(() => {
    if (!selected) return 'Select a match';
    return selected;
  }, [selected]);

  useEffect(() => {
    let active = true;
    setMatches({ status: 'loading', data: null, error: null });

    getMatchesAction(currentUser)
      .then((res) => {
        if (!active) return;
        if ('error' in res) {
          setMatches({ status: 'error', data: null, error: res.error });
          return;
        }
        setMatches({ status: 'ready', data: res.matches, error: null });

        if (!selected && res.matches.length > 0) {
          const next = initialTargetName && res.matches.some((m) => m.name === initialTargetName)
            ? initialTargetName
            : res.matches[0]?.name;
          if (next) setSelected(next);
        }
      })
      .catch((err) => {
        if (!active) return;
        setMatches({ status: 'error', data: null, error: getErrorMessage(err) });
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadThread = (targetName: string) => {
    setThread({ status: 'loading', data: null, error: null });
    getConversationAction(currentUser, targetName)
      .then((res) => {
        if ('error' in res) {
          setThread({ status: 'error', data: null, error: res.error });
          return;
        }
        setThread({ status: 'ready', data: res.messages, error: null });
      })
      .catch((err) => {
        setThread({ status: 'error', data: null, error: getErrorMessage(err) });
      });
  };

  useEffect(() => {
    if (!selected) {
      setThread({ status: 'ready', data: [], error: null });
      return;
    }

    let cancelled = false;
    loadThread(selected);

    const interval = setInterval(() => {
      if (cancelled) return;
      getConversationAction(currentUser, selected)
        .then((res) => {
          if (cancelled) return;
          if ('error' in res) return;
          setThread({ status: 'ready', data: res.messages, error: null });
        })
        .catch(() => {
          // ignore polling errors
        });
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUser, selected]);

  useEffect(() => {
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [thread.status, selected]);

  const selectMatch = (name: string) => {
    setSelected(name);
    router.push(`/messages/${encodeURIComponent(name)}`);
  };

  const onSend = async () => {
    if (!selected || sending) return;
    const msg = text.trim();
    if (!msg) return;

    setSending(true);
    try {
      const res = await sendMessageAction(currentUser, selected, msg);
      if ('error' in res) {
        setThread((prev) => ({
          status: 'error',
          data: prev.status === 'ready' ? prev.data : null,
          error: res.error,
        }));
        return;
      }

      setText('');
      setThread((prev) => {
        const existing = prev.status === 'ready' && prev.data ? prev.data : [];
        return { status: 'ready', data: [...existing, res.message], error: null };
      });

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      setThread((prev) => ({
        status: 'error',
        data: prev.status === 'ready' ? prev.data : null,
        error: getErrorMessage(err),
      }));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <aside className="md:col-span-4 rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-black text-slate-900">Messages</div>
            <div className="text-[11px] font-semibold text-slate-500">Your matched students</div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/discover')}
            className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200/60 rounded-lg px-2 py-1 hover:bg-rose-100"
          >
            Discover
          </button>
        </div>

        <div className="p-2">
          {matches.status === 'loading' ? (
            <div className="p-4 text-xs text-slate-500 font-semibold">Loading matches…</div>
          ) : matches.status === 'error' ? (
            <div className="p-4 text-xs text-rose-700 font-semibold">
              Failed to load matches: {matches.error}
            </div>
          ) : matches.data.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 font-semibold">
              No matches yet. Swipe to match first.
            </div>
          ) : (
            <div className="space-y-1">
              {matches.data.map((m) => {
                const active = selected === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => selectMatch(m.name)}
                    className={
                      'w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors border ' +
                      (active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white hover:bg-slate-50 text-slate-900 border-transparent')
                    }
                  >
                    <div
                      className={
                        'h-8 w-8 rounded-xl flex items-center justify-center font-black text-sm border ' +
                        (active ? 'bg-white/10 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700')
                      }
                    >
                      {m.name[0] ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <div className={"text-xs font-extrabold truncate " + (active ? 'text-white' : 'text-slate-900')}>{m.name}</div>
                      <div className={"text-[11px] font-semibold truncate " + (active ? 'text-white/70' : 'text-slate-500')}>Tap to chat</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <section className="md:col-span-8 rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col min-h-[520px]">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 truncate">{selectedLabel}</div>
            <div className="text-[11px] font-semibold text-slate-500">Match-only messaging</div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-[10px] font-extrabold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-200"
          >
            Back
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-semibold">
              Select a match to start chatting.
            </div>
          ) : thread.status === 'loading' ? (
            <div className="text-xs text-slate-500 font-semibold">Loading conversation…</div>
          ) : thread.status === 'error' ? (
            <div className="text-xs text-rose-700 font-semibold">{thread.error}</div>
          ) : thread.data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-semibold">
              No messages yet. Say hello!
            </div>
          ) : (
            <div className="space-y-2">
              {thread.data.map((m) => (
                <div key={m.id} className={m.direction === 'out' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      'max-w-[80%] rounded-2xl px-3 py-2 text-xs font-semibold border ' +
                      (m.direction === 'out'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-900 border-slate-200')
                    }
                  >
                    <div className="leading-relaxed whitespace-pre-wrap break-words">{m.content}</div>
                    <div className={"mt-1 text-[10px] font-bold " + (m.direction === 'out' ? 'text-white/60' : 'text-slate-400')}>
                      {formatTime(m.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={selected ? 'Type a message…' : 'Select a match first…'}
              rows={2}
              disabled={!selected || sending}
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <button
              type="button"
              onClick={onSend}
              disabled={!selected || sending || text.trim().length === 0}
              className="rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold px-4 py-2.5"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
