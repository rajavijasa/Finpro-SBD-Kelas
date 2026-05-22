'use client';

import { type ReactNode, useState } from 'react';
import { GraduationCap, Users, Sparkles, Heart, Loader2, AlertTriangle } from 'lucide-react';
import { recordSwipeAction } from '@/app/actions/auth';
import { getErrorMessage } from '@/lib/errors';
import { useRecommendationData } from '@/hooks/useRecommendationData';
import { MutualClassResult, FofResult, HobbyClusterResult, SectionState, ConnectStatus, UserSummary } from '@/lib/types';
import { clampText, yearLabel, getBooleanProperty, getStringProperty } from '@/lib/utils';

export default function DiscoverRecommendations({ currentUser }: { currentUser: string }) {
  const { mutual, fof, hobby } = useRecommendationData(currentUser);
  const [connectByName, setConnectByName] = useState<Record<string, ConnectStatus>>({});

  const connect = async (targetName: string) => {
    if (!targetName || targetName === currentUser) return;

    setConnectByName((prev) => ({ ...prev, [targetName]: { status: 'sending' } }));

    try {
      const res = await recordSwipeAction(currentUser, targetName, 'like');
      const actionError = getStringProperty(res, 'error');
      if (actionError) {
        setConnectByName((prev) => ({ ...prev, [targetName]: { status: 'error', message: actionError } }));
        return;
      }

      const isMatch = getBooleanProperty(res, 'isMatch') ?? false;
      setConnectByName((prev) => ({
        ...prev,
        [targetName]: isMatch ? { status: 'matched' } : { status: 'sent' },
      }));
    } catch (err) {
      setConnectByName((prev) => ({ ...prev, [targetName]: { status: 'error', message: getErrorMessage(err) } }));
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
        renderCard={(row: MutualClassResult, idx: number) => (
          <UserCard
            key={`mutual-${row.user.name}-${idx}`}
            user={row.user}
            meta={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="rose">
                  {row.sharedCount} shared class{row.sharedCount === 1 ? '' : 'es'}
                </Badge>
                {row.sharedCourses?.slice(0, 3).map((c, cIdx) => (
                  <Badge key={`${row.user.name}-${c.code ?? c.subject ?? 'course'}-${cIdx}`} tone="slate">
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
        renderCard={(row: FofResult, idx: number) => (
          <UserCard
            key={`fof-${row.user.name}-${idx}`}
            user={row.user}
            meta={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="rose">
                  {row.mutualCount} mutual friend{row.mutualCount === 1 ? '' : 's'}
                </Badge>
                {row.mutualFriends?.slice(0, 3).map((f, fIdx) => (
                  <Badge key={`${row.user.name}-mf-${f.name}-${fIdx}`} tone="slate">
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
        renderCard={(row: HobbyClusterResult, idx: number) => (
          <UserCard
            key={`hobby-${row.user.name}-${row.hobby?.name ?? 'hobby'}-${idx}`}
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

function RecommendationSection<T>({ icon, title, subtitle, state, renderCard }: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  state: SectionState<T[]>;
  renderCard: (row: T, idx: number) => ReactNode;
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

        {state.status === 'ready' && (
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
            {state.data.length} result{state.data.length === 1 ? '' : 's'}
          </span>
        )}
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
              {state.data.map((row, idx) => renderCard(row, idx))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function UserCard({ user, meta, connectStatus, onConnect }: {
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
  const labelMap: Record<string, { text: string; color: string }> = {
    idle: { text: 'Swipe right', color: 'text-slate-400' },
    sending: { text: 'Sending…', color: 'text-slate-500' },
    matched: { text: 'Matched!', color: 'text-emerald-600 font-black' },
    sent: { text: 'Sent', color: 'text-rose-600 font-black' },
    error: { text: 'Error', color: 'text-rose-600 font-black' },
  };

  const { text, color } = labelMap[status.status] || labelMap.idle;

  return (
    <span 
      title={status.status === 'error' ? status.message : undefined} 
      className={`text-[10px] font-bold uppercase tracking-widest ${color}`}
    >
      {text}
    </span>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: 'rose' | 'slate' }) {
  const className = tone === 'rose'
    ? 'bg-rose-500/10 text-rose-700 border-rose-200/60'
    : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold ${className}`}>
      {children}
    </span>
  );
}
