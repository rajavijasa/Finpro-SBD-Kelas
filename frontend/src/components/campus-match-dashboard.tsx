'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction, updateProfileAction } from '@/app/actions/auth';
import type { SwipeDeckCandidate } from '@/app/actions/auth';
import Navbar from '@/components/navbar';

// Sub-components
import { ProfileBanner } from './dashboard/ProfileBanner';
import { SwipeCard } from './dashboard/SwipeCard';
import { RecommendationSections } from './dashboard/RecommendationSections';
import { SettingsModal } from './dashboard/SettingsModal';
import { MatchPopup } from './dashboard/MatchPopup';
import { CandidateDetailModal } from './dashboard/CandidateDetailModal';

// Hooks
import { useSwipeLogic } from '@/hooks/useSwipeLogic';
import { useRecommendationData } from '@/hooks/useRecommendationData';

// Lib
import { 
  MutualClassResult, 
  HobbyClusterResult, 
  StudentProfile, 
  CampusCircleCandidat 
} from '@/lib/types';
import { COLORS, USER_PROFILES } from '@/lib/constants';

interface CampusMatchDashboardProps {
  currentUser: string;
  mutualMatches: MutualClassResult[];
  fofMatches: FofResult[];
  hobbyMatches: HobbyClusterResult[];
  swipeDeck?: SwipeDeckCandidate[];
  likedMeCount?: number;
  profileData: StudentProfile;
}

export default function CampusMatchDashboard({
  currentUser,
  mutualMatches: initialMutual,
  fofMatches: initialFof,
  hobbyMatches: initialHobby,
  swipeDeck: initialSwipeDeck,
  likedMeCount,
  profileData,
}: CampusMatchDashboardProps) {
  const router = useRouter();

  // 1. Logic for Recommendations
  const { mutual, fof, hobby, refetch: refetchRecs } = useRecommendationData(currentUser);
  
  // Use initial data if client-side fetch hasn't completed
  const currentMutual = mutual.status === 'ready' ? mutual.data : initialMutual;
  const currentHobby = hobby.status === 'ready' ? hobby.data : initialHobby;
  const currentFof = fof.status === 'ready' ? fof.data : initialFof;

  // 2. Logic for Swipe Deck
  const mappedCandidates: CampusCircleCandidat[] = useMemo(() => {
    return (initialSwipeDeck || []).map((c) => {
      const profile = USER_PROFILES[c.name];
      const charSum = c.name.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      const defaultColor = COLORS[charSum % COLORS.length];

      let matchType: CampusCircleCandidat['matchType'] = 'general';
      if (c.sharedCourses.length > 0) matchType = 'class';
      else if (c.sharedHobbies.length > 0) matchType = 'hobby';
      else if (c.mutualFriends > 0) matchType = 'fof';

      return {
        name: c.name,
        university: c.university,
        year: c.year,
        matchType,
        bio: profile?.bio || c.bio,
        gender: (profile?.gender || c.gender || 'female') as 'female' | 'male',
        major: profile?.major || c.major,
        faculty: profile?.faculty || c.faculty,
        colorStyle: profile?.colorStyle || defaultColor,
        relevanceScore: c.relevanceScore,
        avatarUrl: c.avatarUrl,
        details: {
          sharedCourses: c.sharedCourses,
          sharedHobbies: c.sharedHobbies,
          mutualFriends: c.mutualFriends,
        },
      };
    });
  }, [initialSwipeDeck]);

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

  // 3. Logic for Candidate Details
  const [detailCandidate, setDetailCandidate] = useState<CampusCircleCandidat | null>(null);

  // 4. Logic for Settings & Profile
  const [showSettings, setShowSettings] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const handleSaveSettings = async (formData: FormData) => {
    setIsUpdatingSettings(true);
    try {
      const result = await updateProfileAction(formData);
      if (result.success) {
        setShowSettings(false);
        refetchRecs();
        router.refresh();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsUpdatingSettings(false);
    }
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      <Navbar currentUser={currentUser} activeTab="match" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileBanner 
          profileData={profileData} 
          likedMeCount={likedMeCount || 0} 
          onOpenSettings={() => setShowSettings(true)} 
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Dashboard Left: Swipe Deck (Larger/Primary) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-md">
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-500 text-white text-[10px]">✨</span>
                  Discovery Deck
                </h3>
              </div>

              <div className="relative aspect-[3/4] w-full perspective-1000">
                {isDone ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-3xl">🏜️</div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">End of the Orbit</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      You&apos;ve scanned everyone in your current trajectory. Try updating your major or hobbies in settings to find new peers!
                    </p>
                    <button 
                      onClick={() => setShowSettings(true)}
                      className="mt-6 text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md"
                    >
                      Update Orbits 🪐
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
                      />
                    ))
                )}
              </div>

              {/* Deck Action Buttons */}
              {!isDone && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  {/* 1. REWIND BUTTON */}
                  <button
                    onClick={rewind}
                    disabled={history.length === 0}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-400 bg-white text-amber-500 hover:bg-amber-50/50 transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-md"
                    title="Rewind Swipe"
                  >
                    <span className="text-lg">↩</span>
                  </button>

                  {/* 2. NOPE BUTTON */}
                  <button 
                    onClick={() => swipe('left')}
                    className="flex h-15 w-15 items-center justify-center rounded-full border-2 border-rose-500 bg-white text-rose-500 hover:bg-rose-50/50 transition-all hover:scale-110 active:scale-95 shadow-lg"
                    title="Pass (Nope)"
                  >
                    <span className="text-2xl font-black">✕</span>
                  </button>

                  {/* 3. SUPER LIKE BUTTON */}
                  <button 
                    onClick={() => swipe('up')}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-sky-400 bg-white text-sky-500 hover:bg-sky-50/50 transition-all hover:scale-110 active:scale-95 shadow-md"
                    title="Super Like"
                  >
                    <span className="text-xl">★</span>
                  </button>

                  {/* 4. LIKE BUTTON */}
                  <button 
                    onClick={() => swipe('right')}
                    className="flex h-15 w-15 items-center justify-center rounded-full border-2 border-emerald-500 bg-white text-emerald-500 hover:bg-emerald-50/50 transition-all hover:scale-110 active:scale-95 shadow-lg"
                    title="Like & Match!"
                  >
                    <span className="text-2xl">❤️</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dashboard Right: Radar Launcher & Info (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-900/10 bg-slate-950 p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.06),transparent_60%)] pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping absolute" />
                  <span className="h-2 w-2 rounded-full bg-rose-500 relative" />
                  <h3 className="text-xs font-black text-rose-500 tracking-widest uppercase">Nebula Orbits Active</h3>
                </div>
                <h2 className="text-xl font-extrabold text-white mt-2 leading-tight">Fullscreen Social Radar</h2>
                <p className="text-[11px] text-slate-400 font-semibold mt-2.5 leading-relaxed">
                  The stardust network has grown to include <strong className="text-white">1,034 students</strong>, <strong className="text-white font-bold">34 academic majors</strong>, and <strong className="text-white">12,037 connections</strong>.
                </p>
                <div className="mt-5">
                  <a
                    href={`/radar?userName=${currentUser}`}
                    className="inline-flex items-center justify-center w-full gap-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 active:scale-[0.98] transition-all text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-lg shadow-rose-500/20"
                  >
                    <span>Launch Fullscreen Radar</span>
                    <span className="text-xs group-hover:translate-x-0.5 transition-transform">🚀</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-rose-500">Spark Strategy Guide 📚</h4>
              <ul className="mt-3 space-y-2 text-[11px] text-slate-500 leading-relaxed font-medium">
                <li className="flex gap-2">
                  <span className="text-rose-500">•</span>
                  <span><strong>Tinder Swipe Stack:</strong> Swipe cards to reject or like. We pull from mutual classmates and shared hobbies.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-500">•</span>
                  <span><strong>Radar mapping:</strong> The graph shows how you are linked to candidates in 2-degree Neo4j orbits.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recommendations Grid */}
        <div className="mt-8">
          <RecommendationSections 
            mutualMatches={currentMutual}
            hobbyMatches={currentHobby}
            fofMatches={currentFof}
            loadingMutual={mutual.status === 'loading'}
            loadingHobby={hobby.status === 'loading'}
            loadingFof={fof.status === 'loading'}
            onConnect={(name) => router.push(`/messages/${name}`)}
          />
        </div>
      </main>

      {/* Modals & Popups */}
      {showSettings && (
        <SettingsModal 
          profileData={profileData}
          isUpdating={isUpdatingSettings}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
        />
      )}

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
