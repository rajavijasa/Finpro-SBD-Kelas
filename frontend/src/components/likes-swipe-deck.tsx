'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction, LikedMeCandidate } from '@/app/actions/auth';
import Navbar from '@/components/navbar';

// Sub-components
import { SwipeCard } from './dashboard/SwipeCard';
import { CandidateDetailModal } from './dashboard/CandidateDetailModal';
import { MatchPopup } from './dashboard/MatchPopup';

// Hooks
import { useSwipeLogic } from '@/hooks/useSwipeLogic';

// Lib
import { 
  CampusCircleCandidat, 
  FofResult 
} from '@/lib/types';
import { COLORS, USER_PROFILES } from '@/lib/constants';
import { fetchJson, getStudentAvatar } from '@/lib/utils';

interface LikesSwipeDeckProps {
  currentUser: string;
  likedMeDeck: LikedMeCandidate[];
}

export default function LikesSwipeDeck({
  currentUser,
  likedMeDeck,
}: LikesSwipeDeckProps) {
  const router = useRouter();
  const [view, setView] = useState<'likes' | 'fof'>('likes');

  // 1. Logic for "Liked Me" Deck
  const mappedCandidates: CampusCircleCandidat[] = useMemo(() => {
    return likedMeDeck.map((c) => {
      const profile = USER_PROFILES[c.name];
      const charSum = c.name.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      const defaultColor = COLORS[charSum % COLORS.length];

      return {
        name: c.name,
        university: c.university,
        year: c.year,
        matchType: 'general',
        bio: profile?.bio || c.bio,
        gender: (profile?.gender || c.gender || 'female') as 'female' | 'male',
        major: profile?.major || c.major,
        faculty: profile?.faculty || c.faculty,
        colorStyle: profile?.colorStyle || defaultColor,
        relevanceScore: 0,
        avatarUrl: c.avatarUrl,
        details: {
          // swipeType is specific to LikedMeCandidate
          ...(c as any).swipeType && { swipeType: (c as any).swipeType }
        },
      };
    });
  }, [likedMeDeck]);

  const [matchPopup, setMatchPopup] = useState<{ show: boolean; targetName: string } | null>(null);

  const {
    candidates,
    currentIndex,
    dragOffset,
    isDragging,
    flyOutDirection,
    swipe,
    rewind,
    handleDragStart,
    isDone,
    history
  } = useSwipeLogic(currentUser, mappedCandidates, (targetName) => {
    setMatchPopup({ show: true, targetName });
  });

  // 2. Logic for FOF Recommendations
  const [fofCandidates, setFofCandidates] = useState<FofResult[]>([]);
  const [fofLoading, setFofLoading] = useState(false);

  useEffect(() => {
    if (view === 'fof' && !fofLoading && fofCandidates.length === 0) {
      setFofLoading(true);
      fetchJson<FofResult[]>(`/api/recommendations/fof?userName=${encodeURIComponent(currentUser)}`)
        .then(setFofCandidates)
        .catch(err => console.error('Failed to fetch FOF', err))
        .finally(() => setFofLoading(false));
    }
  }, [view, currentUser, fofLoading, fofCandidates.length]);

  // 3. Logic for Candidate Details
  const [detailCandidate, setDetailCandidate] = useState<CampusCircleCandidat | null>(null);

  const handleLogout = async () => {
    await logoutAction();
  };

  // Helper for card styling
  const getCardStyle = useCallback((index: number) => {
    if (index !== currentIndex) {
      const diff = index - currentIndex;
      if (diff > 2 || diff < 0) return { display: 'none' };
      const scale = 1 - diff * 0.04;
      const translateY = diff * 12;
      return {
        transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
        zIndex: 30 - diff,
        opacity: 1 - diff * 0.3,
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
      };
    }

    if (flyOutDirection) {
      const flyX = flyOutDirection === 'left' ? -800 : flyOutDirection === 'right' ? 800 : 0;
      const flyY = flyOutDirection === 'up' ? -800 : 0;
      const rotate = flyOutDirection === 'left' ? -20 : flyOutDirection === 'right' ? 20 : 0;
      return {
        transform: `translate3d(${flyX}px, ${flyY}px, 0) rotate(${rotate}deg)`,
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 40,
      };
    }


    return {
      transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x / 20}deg)`,
      transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      zIndex: 40,
      cursor: isDragging ? 'grabbing' : 'grab',
    };
  }, [currentIndex, flyOutDirection, dragOffset, isDragging]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar currentUser={currentUser} activeTab="likes" />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* View Toggle */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit mx-auto mb-10">
          <button
            onClick={() => setView('likes')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              view === 'likes' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            💘 Likes You
          </button>
          <button
            onClick={() => setView('fof')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              view === 'fof' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            ✨ People You May Know
          </button>
        </div>

        {view === 'likes' ? (
          <div className="flex flex-col items-center">
            <header className="text-center mb-8">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">People Who Liked You</h1>
              <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">
                These students already swiped right. Swipe back to match!
              </p>
            </header>

            <div className="w-full max-w-sm relative aspect-[3/4] perspective-1000">
              {isDone ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center shadow-sm">
                  <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-4 text-3xl">📭</div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">No More Likes</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    You&apos;ve cleared your &quot;Liked You&quot; deck. Check back later or keep exploring in the main dashboard!
                  </p>
                  <button 
                    onClick={() => router.push('/')}
                    className="mt-6 text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md"
                  >
                    Go Explore 🚀
                  </button>
                </div>
              ) : (
                candidates
                  .slice(currentIndex, currentIndex + 3)
                  .map((card, i) => ({ card, actualIdx: currentIndex + i }))
                  .reverse()
                  .map(({ card, actualIdx }) => (
                    <SwipeCard
                      key={`${card.name}-${actualIdx}`}
                      card={card}
                      isTop={actualIdx === currentIndex}
                      isDragging={isDragging && actualIdx === currentIndex}
                      dragOffset={dragOffset}
                      style={getCardStyle(actualIdx)}
                      onMouseDown={(e) => actualIdx === currentIndex && handleDragStart(e.clientX, e.clientY)}
                      onTouchStart={(e) => actualIdx === currentIndex && e.touches[0] && handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
                      onShowDetails={(c) => setDetailCandidate(c)}
                      badge={{
                        text: (card.details as any).swipeType === 'super' ? 'Super Liked You!' : 'Liked You!',
                        icon: '💘',
                        color: 'bg-pink-500/90'
                      }}
                    />
                  ))
              )}
            </div>

            {!isDone && (
              <div className="mt-10 flex flex-col items-center gap-8">
                <div className="flex items-center justify-center gap-4">
                  {/* 1. REWIND BUTTON */}
                  <button 
                    onClick={rewind}
                    disabled={history.length === 0}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-400 bg-white text-amber-500 hover:bg-amber-50/50 transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-md"
                    title="Rewind Swipe"
                  >
                    <span className="text-lg">🔄</span>
                  </button>

                  {/* 2. NOPE BUTTON */}
                  <button 
                    onClick={() => swipe('left')}
                    className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-rose-500 bg-white text-rose-500 hover:bg-rose-50/50 transition-all hover:scale-110 active:scale-95 shadow-xl"
                    title="Pass (Nope)"
                  >
                    <span className="text-2xl font-black">✕</span>
                  </button>

                  {/* 3. LIKE BUTTON */}
                  <button 
                    onClick={() => swipe('right')}
                    className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500 bg-white text-emerald-500 hover:bg-emerald-50/50 transition-all hover:scale-110 active:scale-95 shadow-xl"
                    title="Like & Match!"
                  >
                    <span className="text-2xl">❤️</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <header className="bg-gradient-to-r from-sky-50 to-indigo-50 rounded-2xl border border-sky-200/50 p-6 shadow-sm text-center">
              <h1 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
                <span>✨</span> Friend of Friend Recommendations
              </h1>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Expand your network! These students share mutual friends with you.
              </p>
            </header>

            {fofLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-48 border border-slate-100 shadow-sm p-5 flex flex-col justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-200"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-slate-100 rounded-xl mt-4 w-full"></div>
                  </div>
                ))}
              </div>
            ) : fofCandidates.length === 0 ? (
              <div className="w-full rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center text-center p-16 shadow-sm">
                <span className="text-5xl mb-4 opacity-50">🕸️</span>
                <h3 className="text-lg font-black text-slate-900">No Recommendations Yet</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
                  Connect with more people to see friend-of-friend suggestions!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {fofCandidates.map((fof, idx) => (
                  <div key={idx} className="bg-white hover:border-sky-300 transition-all border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col group">
                    <div className="flex items-center gap-4">
                      <img 
                        src={getStudentAvatar(fof.user.name)} 
                        alt={fof.user.name} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-slate-900 truncate">
                          {fof.user.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">
                          {fof.user.university || 'Campus Circle'}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-sky-100 text-[9px] font-black text-sky-600">
                            {fof.mutualCount}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            Mutual Friends
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100 flex-1">
                      <p className="text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-tight">Mutual Friends:</p>
                      <div className="flex flex-wrap gap-1">
                        {fof.mutualFriends.map(f => (
                          <span key={f} className="bg-white text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => router.push(`/messages/${fof.user.name}`)}
                      className="mt-4 w-full bg-slate-900 text-white text-[10px] font-black uppercase py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
                    >
                      Spark Connect ⚡
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals & Popups */}
      {detailCandidate && (
        <CandidateDetailModal 
          currentUser={currentUser}
          candidate={detailCandidate}
          onClose={() => setDetailCandidate(null)}
          onSwipe={(dir) => {
            setDetailCandidate(null);
            swipe(dir);
          }}
        />
      )}

      {matchPopup && (
        <MatchPopup 
          targetName={matchPopup.targetName}
          onClose={() => setMatchPopup(null)}
          onChat={(name) => {
            setMatchPopup(null);
            router.push(`/messages/${name}`);
          }}
        />
      )}
    </div>
  );
}
