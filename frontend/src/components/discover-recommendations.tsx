'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  GraduationCap,
  Users,
  Sparkles,
  Heart,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { recordSwipeAction } from '@/app/actions/auth';
import { getErrorMessage } from '@/lib/errors';

type UserSummary = {
  name: string;
  university?: string;
  year?: number;
};

type CourseSummary = {
  subject?: string;
  code?: string;
};

type MutualClassResult = {
  user: UserSummary;
  sharedCount: number;
  sharedCourses: CourseSummary[];
};

type FofResult = {
  user: UserSummary;
  mutualCount: number;
  mutualFriends: UserSummary[];
};

type MajorSummary = {
  name?: string;
  faculty?: string;
};

type HobbySummary = {
  name?: string;
  category?: string;
};

type HobbyClusterResult = {
  user: UserSummary;
  major: MajorSummary | null;
  hobby: HobbySummary;
};

type SectionState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: T; error: null }
  | { status: 'error'; data: null; error: string };

type ConnectStatus =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent' }
  | { status: 'matched' }
  | { status: 'error'; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getStringProperty(value: unknown, key: string): string | null {
  if (!isRecord(value)) return null;
  const prop = value[key];
  return typeof prop === 'string' ? prop : null;
}

function getBooleanProperty(value: unknown, key: string): boolean | null {
  if (!isRecord(value)) return null;
  const prop = value[key];
  return typeof prop === 'boolean' ? prop : null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const errMsg = getStringProperty(json, 'error') ?? `Request failed: ${res.status}`;
    throw new Error(errMsg);
  }

  return json as T;
}

function clampText(value: string, max = 64): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function yearLabel(year?: number): string | null {
  if (!year || !Number.isFinite(year)) return null;
  return `Year ${year}`;
}

export default function DiscoverRecommendations({ currentUser }: { currentUser: string }) {
  const [mutual, setMutual] = useState<SectionState<MutualClassResult[]>>({
    status: 'loading',
    data: null,
    error: null,
  });
  const [fof, setFof] = useState<SectionState<FofResult[]>>({
    status: 'loading',
    data: null,
    error: null,
  });
  const [hobby, setHobby] = useState<SectionState<HobbyClusterResult[]>>({
    status: 'loading',
    data: null,
    error: null,
  });

  const [connectByName, setConnectByName] = useState<Record<string, ConnectStatus>>({});

  const limit = 20;
  const urls = useMemo(() => {
    const p = new URLSearchParams({ userName: currentUser, limit: String(limit) });
    return {
      mutual: `/api/recommendations/mutual-classes?${p.toString()}`,
      fof: `/api/recommendations/fof?${p.toString()}`,
      hobby: `/api/recommendations/hobby-cluster?${p.toString()}`,
    };
  }, [currentUser]);

  useEffect(() => {
    let active = true;

    setMutual({ status: 'loading', data: null, error: null });
    setFof({ status: 'loading', data: null, error: null });
    setHobby({ status: 'loading', data: null, error: null });

    Promise.allSettled([
      fetchJson<MutualClassResult[]>(urls.mutual),
      fetchJson<FofResult[]>(urls.fof),
      fetchJson<HobbyClusterResult[]>(urls.hobby),
    ])
      .then((results) => {
        if (!active) return;

        const [mutualRes, fofRes, hobbyRes] = results;

        if (mutualRes.status === 'fulfilled') {
          setMutual({ status: 'ready', data: mutualRes.value ?? [], error: null });
        } else {
          setMutual({ status: 'error', data: null, error: getErrorMessage(mutualRes.reason) });
        }

        if (fofRes.status === 'fulfilled') {
          setFof({ status: 'ready', data: fofRes.value ?? [], error: null });
        } else {
          setFof({ status: 'error', data: null, error: getErrorMessage(fofRes.reason) });
        }

        if (hobbyRes.status === 'fulfilled') {
          setHobby({ status: 'ready', data: hobbyRes.value ?? [], error: null });
        } else {
          setHobby({ status: 'error', data: null, error: getErrorMessage(hobbyRes.reason) });
        }
      })
      .catch((err) => {
        if (!active) return;
        const msg = getErrorMessage(err);
        setMutual({ status: 'error', data: null, error: msg });
        setFof({ status: 'error', data: null, error: msg });
        setHobby({ status: 'error', data: null, error: msg });
      });

    return () => {
      active = false;
    };
  }, [urls]);

  const connect = async (targetName: string) => {
    if (!targetName || targetName === currentUser) return;

    setConnectByName((prev) => ({
      ...prev,
      [targetName]: { status: 'sending' },
    }));

    try {
      const res = await recordSwipeAction(currentUser, targetName, 'like');
      const actionError = getStringProperty(res, 'error');
      if (actionError) {
        setConnectByName((prev) => ({
          ...prev,
          [targetName]: { status: 'error', message: actionError },
        }));
        return;
      }

      const isMatch = getBooleanProperty(res, 'isMatch') ?? false;
      setConnectByName((prev) => ({
        ...prev,
        [targetName]: isMatch ? { status: 'matched' } : { status: 'sent' },
      }));
    } catch (err) {
      setConnectByName((prev) => ({
        ...prev,
        [targetName]: { status: 'error', message: getErrorMessage(err) },
      }));
    }
  };

  const getConnectStatus = (name: string): ConnectStatus => connectByName[name] ?? { status: 'idle' };

  return (
    <div className="space-y-10">
      <RecommendationSection
        icon={<GraduationCap className="h-4 w-4 text-rose-600" />}
        title="Mutual Class Finder"
        subtitle="Students who share your enrolled courses"
        state={mutual}
        renderCard={(row) => (
          <UserCard
            key={`mutual-${row.user.name}`}
            user={row.user}
            meta={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="rose">
                  {row.sharedCount} shared class{row.sharedCount === 1 ? '' : 'es'}
                </Badge>
                {row.sharedCourses?.slice(0, 3).map((c) => (
                  <Badge key={`${row.user.name}-${c.code ?? c.subject ?? 'course'}`} tone="slate">
                    {c.code ?? c.subject ?? 'Course'}
                  </Badge>
                ))}
              </div>
            }
            connectStatus={getConnectStatus(row.user.name)}
            onConnect={() => connect(row.user.name)}
          />
        )}
      />

      <RecommendationSection
        icon={<Users className="h-4 w-4 text-rose-600" />}
        title="Friend of Friend Recommendations"
        subtitle="Potential connections through your social orbits"
        state={fof}
        renderCard={(row) => (
          <UserCard
            key={`fof-${row.user.name}`}
            user={row.user}
            meta={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="rose">
                  {row.mutualCount} mutual friend{row.mutualCount === 1 ? '' : 's'}
                </Badge>
                {row.mutualFriends?.slice(0, 3).map((f) => (
                  <Badge key={`${row.user.name}-mf-${f.name}`} tone="slate">
                    {f.name}
                  </Badge>
                ))}
              </div>
            }
            connectStatus={getConnectStatus(row.user.name)}
            onConnect={() => connect(row.user.name)}
          />
        )}
      />

      <RecommendationSection
        icon={<Sparkles className="h-4 w-4 text-rose-600" />}
        title="Hobby Clusters"
        subtitle="People who share at least one hobby"
        state={hobby}
        renderCard={(row) => (
          <UserCard
            key={`hobby-${row.user.name}-${row.hobby?.name ?? 'hobby'}`}
            user={row.user}
            meta={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="rose">{row.hobby?.name ?? 'Shared hobby'}</Badge>
                {row.major?.name ? <Badge tone="slate">{row.major.name}</Badge> : null}
                {row.major?.faculty ? <Badge tone="slate">{row.major.faculty}</Badge> : null}
              </div>
            }
            connectStatus={getConnectStatus(row.user.name)}
            onConnect={() => connect(row.user.name)}
          />
        )}
      />
    </div>
  );
}

function RecommendationSection<T>({
  icon,
  title,
  subtitle,
  state,
  renderCard,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  state: SectionState<T[]>;
  renderCard: (row: T) => ReactNode;
}) {
  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-200/60">
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-slate-900">{title}</h2>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">{subtitle}</p>
          </div>
        </div>

        {state.status === 'ready' ? (
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
            {state.data.length} result{state.data.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        {state.status === 'loading' ? (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
            <span>Loading recommendations…</span>
          </div>
        ) : state.status === 'error' ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-rose-600" />
            <div>
              <div className="font-bold">Failed to load</div>
              <div className="mt-0.5 text-rose-700/80">{state.error}</div>
            </div>
          </div>
        ) : state.data.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 font-semibold">
            No results for this section yet.
          </div>
        ) : (
          <div className="-mx-6 overflow-x-auto px-6">
            <div className="flex gap-3 pb-2">
              {state.data.map((row) => renderCard(row))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function UserCard({
  user,
  meta,
  connectStatus,
  onConnect,
}: {
  user: UserSummary;
  meta: ReactNode;
  connectStatus: ConnectStatus;
  onConnect: () => void;
}) {
  const subtitle = [user.university, yearLabel(user.year)].filter(Boolean).join(' • ');
  const canConnect = connectStatus.status === 'idle' || connectStatus.status === 'error';

  return (
    <div className="w-[280px] shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-slate-900">{clampText(user.name, 38)}</div>
          {subtitle ? (
            <div className="mt-0.5 text-[11px] text-slate-500 font-semibold">{clampText(subtitle, 46)}</div>
          ) : (
            <div className="mt-0.5 text-[11px] text-slate-400 font-semibold">Suggested student</div>
          )}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-black">
          {user.name?.[0] ?? '?'}
        </div>
      </div>

      <div className="mt-3">{meta}</div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onConnect}
          disabled={!canConnect}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold px-3.5 py-2 transition-colors"
        >
          {connectStatus.status === 'sending' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className="h-4 w-4" />
          )}
          <span>Connect</span>
        </button>

        <ConnectIndicator status={connectStatus} />
      </div>
    </div>
  );
}

function ConnectIndicator({ status }: { status: ConnectStatus }) {
  if (status.status === 'idle') {
    return (
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Swipe right</span>
    );
  }

  if (status.status === 'sending') {
    return (
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sending…</span>
    );
  }

  if (status.status === 'matched') {
    return (
      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Matched!</span>
    );
  }

  if (status.status === 'sent') {
    return (
      <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Sent</span>
    );
  }

  return (
    <span title={status.message} className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
      Error
    </span>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: 'rose' | 'slate';
}) {
  const className =
    tone === 'rose'
      ? 'bg-rose-500/10 text-rose-700 border-rose-200/60'
      : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold ${className}`}>
      {children}
    </span>
  );
}

