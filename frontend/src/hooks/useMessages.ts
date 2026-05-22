import { useState, useEffect } from 'react';
import { getConversationAction, getMatchesAction, sendMessageAction, type ChatMessage, type MatchSummary } from '@/app/actions/messages';
import { Loadable } from '@/lib/types';
import { getErrorMessage } from '@/lib/errors';

export function useMessages(currentUser: string, selectedTarget: string | null) {
  const [matches, setMatches] = useState<Loadable<MatchSummary[]>>({ status: 'loading', data: null, error: null });
  const [thread, setThread] = useState<Loadable<ChatMessage[]>>({ status: 'loading', data: null, error: null });
  const [sending, setSending] = useState(false);

  // Load matches
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
      })
      .catch((err) => {
        if (!active) return;
        setMatches({ status: 'error', data: null, error: getErrorMessage(err) });
      });

    return () => { active = false; };
  }, [currentUser]);

  // Load thread and poll
  useEffect(() => {
    if (!selectedTarget) {
      setThread({ status: 'ready', data: [], error: null });
      return;
    }

    let active = true;
    setThread({ status: 'loading', data: null, error: null });

    const fetchThread = async (isPoll = false) => {
      try {
        const res = await getConversationAction(currentUser, selectedTarget);
        if (!active) return;
        if ('error' in res) {
          if (!isPoll) setThread({ status: 'error', data: null, error: res.error });
          return;
        }
        setThread({ status: 'ready', data: res.messages, error: null });
      } catch (err) {
        if (!active || isPoll) return;
        setThread({ status: 'error', data: null, error: getErrorMessage(err) });
      }
    };

    fetchThread();

    const interval = setInterval(() => fetchThread(true), 2500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [currentUser, selectedTarget]);

  const sendMessage = async (text: string) => {
    if (!selectedTarget || sending) return;
    const msg = text.trim();
    if (!msg) return;

    setSending(true);
    try {
      const res = await sendMessageAction(currentUser, selectedTarget, msg);
      if ('error' in res) {
        setThread((prev) => ({
          status: 'error',
          data: prev.status === 'ready' ? prev.data : null,
          error: res.error,
        }));
        return { success: false, error: res.error };
      }

      setThread((prev) => {
        const existing = prev.status === 'ready' && prev.data ? prev.data : [];
        return { status: 'ready', data: [...existing, res.message], error: null };
      });
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err);
      setThread((prev) => ({
        status: 'error',
        data: prev.status === 'ready' ? prev.data : null,
        error: msg,
      }));
      return { success: false, error: msg };
    } finally {
      setSending(false);
    }
  };

  return { matches, thread, sending, sendMessage };
}
