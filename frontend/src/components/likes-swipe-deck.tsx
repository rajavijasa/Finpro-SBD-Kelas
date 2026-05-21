'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction, recordSwipeAction, fetchRelationGraphAction } from '@/app/actions/auth';
import type { LikedMeCandidate } from '@/app/actions/auth';
import Navbar from '@/components/navbar';


// Deterministic high-definition stock student portraits from Unsplash
const PORTRAITS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1489980508314-941910ded1f4?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1504257404764-5498b6d0a72d?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&q=80&w=600"
];

function getStudentAvatar(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PORTRAITS[Math.abs(hash) % PORTRAITS.length];
}

const FACULTY_MAP: Record<string, 'Computing' | 'Engineering' | 'Business' | 'Art & Design'> = {
  'Information Systems': 'Computing',
  'Computer Science': 'Computing',
  'Software Engineering': 'Computing',
  'Mechanical Engineering': 'Engineering',
  'Electrical Engineering': 'Engineering',
  'Civil Engineering': 'Engineering',
  'Business Administration': 'Business',
  'Finance & Accounting': 'Business',
  'Marketing & Communication': 'Business',
  'Visual Communication Design': 'Art & Design',
  'Interior Design': 'Art & Design',
  'Digital Media Production': 'Art & Design',
};

interface LikesSwipeDeckProps {
  currentUser: string;
  likedMeDeck: LikedMeCandidate[];
}

export default function LikesSwipeDeck({ currentUser, likedMeDeck }: LikesSwipeDeckProps) {
  const router = useRouter();

  // Tabs state
  const [activeTab, setActiveTab] = useState<'liked' | 'fof'>('liked');
  
  // Liked Me state
  const [candidates] = useState(likedMeDeck);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [matchPopup, setMatchPopup] = useState<{ show: boolean; targetName: string } | null>(null);

  // State for candidate details modal
  const [detailCandidate, setDetailCandidate] = useState<LikedMeCandidate | null>(null);
  const [relationData, setRelationData] = useState<any>(null);
  const [loadingRelation, setLoadingRelation] = useState(false);

  useEffect(() => {
    if (!detailCandidate) {
      setRelationData(null);
      return;
    }
    
    const candidateName = detailCandidate.name;
    async function loadRelation() {
      setLoadingRelation(true);
      try {
        const data = await fetchRelationGraphAction(currentUser, candidateName);
        setRelationData(data);
      } catch (err) {
        console.error('Error fetching relation graph data:', err);
      } finally {
        setLoadingRelation(false);
      }
    }
    loadRelation();
  }, [detailCandidate, currentUser]);

  // FOF State
  const [fofCandidates, setFofCandidates] = useState<any[]>([]);
  const [fofLoading, setFofLoading] = useState(true);

  // Gesture states
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flyOutDirection, setFlyOutDirection] = useState<'left' | 'right' | 'up' | null>(null);

  // Fetch FOF recommendations
  useEffect(() => {
    async function fetchFof() {
      try {
        setFofLoading(true);
        const res = await fetch(`/api/recommendations/fof?userName=${encodeURIComponent(currentUser)}`);
        if (res.ok) {
          const data = await res.json();
          setFofCandidates(data);
        }
      } catch (e) {
        console.error("Failed to fetch FOF", e);
      } finally {
        setFofLoading(false);
      }
    }
    fetchFof();
  }, [currentUser]);

  const swipe = async (direction: 'left' | 'right' | 'up') => {
    if (currentIndex >= candidates.length) return;

    const candidate = candidates[currentIndex];
    setFlyOutDirection(direction);

    const swipeType = direction === 'left' ? 'nope' : direction === 'right' ? 'like' : 'super';

    const swipePromise = recordSwipeAction(currentUser, candidate.name, swipeType);

    setTimeout(async () => {
      setHistory(prev => [...prev, currentIndex]);
      setCurrentIndex(prev => prev + 1);
      setDragOffset({ x: 0, y: 0 });
      setFlyOutDirection(null);

      if (direction === 'right' || direction === 'up') {
        const result = await swipePromise;
        if (result && 'isMatch' in result && result.isMatch) {
          setMatchPopup({ show: true, targetName: candidate.name });
        }
      }
    }, 250);
  };

  const rewind = () => {
    if (history.length === 0) return;
    const prevIndices = [...history];
    const prevIndex = prevIndices.pop()!;
    setHistory(prevIndices);
    setCurrentIndex(prevIndex);
  };

  // Drag handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  };
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStart || !isDragging) return;
    setDragOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };
  const handleDragEnd = () => {
    if (!isDragging) return;
    const threshold = 80;
    if (dragOffset.x > threshold) swipe('right');
    else if (dragOffset.x < -threshold) swipe('left');
    else if (dragOffset.y < -threshold && Math.abs(dragOffset.x) < 40) swipe('up');
    else setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setDragStart(null);
  };

  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX, e.clientY);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => { if (isDragging) handleDragMove(e.clientX, e.clientY); };
    const handleGlobalMouseUp = () => { if (isDragging) handleDragEnd(); };
    const handleGlobalTouchMove = (e: TouchEvent) => { if (isDragging && e.touches[0]) handleDragMove(e.touches[0].clientX, e.touches[0].clientY); };
    const handleGlobalTouchEnd = () => { if (isDragging) handleDragEnd(); };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove);
    window.addEventListener('touchend', handleGlobalTouchEnd);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, dragStart, dragOffset]);

  const getCardStyle = (index: number) => {
    if (index !== currentIndex) {
      const diff = index - currentIndex;
      if (diff > 2) return { display: 'none' as const };
      const scale = 1 - diff * 0.04;
      const translateY = diff * 10;
      return {
        transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
        zIndex: 30 - diff,
        opacity: 1 - diff * 0.3,
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
      };
    }
    if (flyOutDirection) {
      const flyX = flyOutDirection === 'left' ? -600 : flyOutDirection === 'right' ? 600 : 0;
      const flyY = flyOutDirection === 'up' ? -600 : 0;
      const rotate = flyOutDirection === 'left' ? -15 : flyOutDirection === 'right' ? 15 : 0;
      return {
        transform: `translate3d(${flyX}px, ${flyY}px, 0) rotate(${rotate}deg)`,
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 30,
      };
    }
    const rotate = dragOffset.x * 0.06;
    return {
      transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotate}deg)`,
      transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
      cursor: isDragging ? 'grabbing' as const : 'grab' as const,
      zIndex: 30,
    };
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans antialiased selection:bg-pink-100 selection:text-pink-900 pb-20">

      {/* Header */}
      <Navbar currentUser={currentUser} activeTab="likes" />


      <main className="mx-auto w-full max-w-5xl px-6 mt-8">
        {/* Tabs for Liked You vs Recommendations */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-200/50 p-1 rounded-xl flex gap-1 shadow-inner border border-slate-200">
            <button
              onClick={() => setActiveTab('liked')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === 'liked' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Liked You ({candidates.length})
            </button>
            <button
              onClick={() => setActiveTab('fof')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === 'fof' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Recommendations ✨
            </button>
          </div>
        </div>

        {activeTab === 'liked' ? (
          <>
            {/* Info Banner */}
            <section className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-200/50 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col items-center text-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span className="text-2xl">💘</span> People Who Liked You
              </h1>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                These students have already swiped right or up on you! Swipe right to match instantly. You have <strong className="text-pink-600">{candidates.length}</strong> pending interest{candidates.length !== 1 ? 's' : ''}.
              </p>
            </section>

            {/* Swipe Deck */}
            <section className="mt-8 flex flex-col items-center">
              <div className="relative w-full max-w-[340px] h-[460px] select-none flex items-center justify-center">

                {currentIndex >= candidates.length ? (
                  <div className="w-full h-full rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center text-center p-6 shadow-sm">
                    <div className="h-16 w-16 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-2xl mb-4">
                      ✅
                    </div>
                    <h3 className="text-base font-extrabold text-slate-950">All Caught Up!</h3>
                    <p className="text-xs text-slate-400 mt-2 max-w-[240px] leading-relaxed">
                      You've reviewed all people who liked you. Check back later for new interests!
                    </p>
                    <a
                      href="/"
                      className="mt-6 flex items-center gap-1 bg-slate-900 hover:bg-slate-800 transition-colors px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
                    >
                      ← Back to Discover
                    </a>
                  </div>
                ) : (
                  candidates.map((card, index) => {
                    if (index < currentIndex) return null;
                    const isTop = index === currentIndex;

                    return (
                      <div
                        key={`liked-card-${card.name}-${index}`}
                        onMouseDown={isTop ? onMouseDown : undefined}
                        onTouchStart={isTop ? onTouchStart : undefined}
                        style={getCardStyle(index)}
                        className={`absolute w-full h-full rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.12)] bg-slate-900 select-none ${
                          isTop ? 'border border-white/20' : 'border border-white/5'
                        }`}
                      >
                        {/* Full-Bleed HD Portrait Background */}
                        <div className="absolute inset-0 z-0">
                          <img
                            src={card.avatarUrl || getStudentAvatar(card.name)}
                            alt={card.name}
                            className="w-full h-full object-cover select-none pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/5 pointer-events-none" />
                        </div>

                        {/* Detail Trigger Overlay Button */}
                        {isTop && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDetailCandidate(card);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="absolute top-4 right-4 z-40 pointer-events-auto bg-black/60 hover:bg-black/85 hover:scale-105 active:scale-95 text-white border border-white/20 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1 shadow-md"
                            title="View Details & Graph Orbits"
                          >
                            <span>🔍</span> Details & Graph
                          </button>
                        )}

                        {/* Drag Stamp Overlays */}
                        {isTop && isDragging && dragOffset.x > 35 && (
                          <div className="absolute top-8 left-8 z-30 -rotate-12 border-4 border-emerald-500 rounded-xl px-3 py-1.5 text-xl font-black text-emerald-500 uppercase tracking-widest bg-black/45 backdrop-blur-xs select-none shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                            LIKE
                          </div>
                        )}
                        {isTop && isDragging && dragOffset.x < -35 && (
                          <div className="absolute top-8 right-8 z-30 rotate-12 border-4 border-rose-500 rounded-xl px-3 py-1.5 text-xl font-black text-rose-500 uppercase tracking-widest bg-black/45 backdrop-blur-xs select-none shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                            NOPE
                          </div>
                        )}
                        {isTop && isDragging && dragOffset.y < -35 && Math.abs(dragOffset.x) < 30 && (
                          <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-30 border-4 border-sky-400 rounded-xl px-3 py-1 text-base font-black text-sky-400 uppercase tracking-widest bg-black/45 backdrop-blur-xs select-none shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                            SUPER LIKE
                          </div>
                        )}

                        {/* Profile Info */}
                        <div className="absolute bottom-0 left-0 right-0 z-10 p-5 flex flex-col justify-end text-white select-none pointer-events-none">
                          <div className="flex items-baseline gap-2">
                            <h2 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                              {card.name}
                            </h2>
                            <span className="text-xl font-bold text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                              {20 + (card.year || 0)}
                            </span>
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
                          </div>

                          <div className="mt-1.5 space-y-1 text-xs font-bold text-white/80 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">🏫</span>
                              <span className="truncate">{card.university}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-rose-300 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">
                              <span className="text-sm">🎓</span>
                              <span className="truncate">{card.major}</span>
                            </div>
                          </div>

                          <p className="mt-3 text-[11px] text-white/90 font-semibold italic bg-black/40 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 leading-relaxed shadow-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                            &quot;{card.bio}&quot;
                          </p>

                          {/* "Liked You" Badge */}
                          <div className="flex flex-wrap gap-1.5 mt-3 select-none">
                            <span className="bg-pink-500/90 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-pink-400/20 shadow-sm flex items-center gap-1">
                              <span>💘</span> {card.swipeType === 'super' ? 'Super Liked You!' : 'Liked You!'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Buttons */}
              {currentIndex < candidates.length && (
                <div className="flex items-center justify-center gap-4 mt-6 select-none">
                  <button
                    onClick={rewind}
                    disabled={history.length === 0}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-400 bg-white text-amber-500 hover:bg-amber-50/50 transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-md shadow-amber-400/5"
                    title="Rewind Swipe"
                  >
                    <span className="text-base">🔄</span>
                  </button>

                  <button
                    onClick={() => swipe('left')}
                    className="flex h-15 w-15 items-center justify-center rounded-full border-2 border-rose-500 bg-white text-rose-500 hover:bg-rose-50/50 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-rose-500/10"
                    title="Pass (Nope)"
                  >
                    <span className="text-xl font-black">✕</span>
                  </button>

                  <button
                    onClick={() => swipe('up')}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-sky-400 bg-white text-sky-500 hover:bg-sky-50/50 transition-all hover:scale-110 active:scale-95 shadow-md shadow-sky-400/5"
                    title="Super Like"
                  >
                    <span className="text-lg">★</span>
                  </button>

                  <button
                    onClick={() => swipe('right')}
                    className="flex h-15 w-15 items-center justify-center rounded-full border-2 border-emerald-500 bg-white text-emerald-500 hover:bg-emerald-50/50 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-emerald-500/10"
                    title="Like & Match!"
                  >
                    <span className="text-xl">❤️</span>
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            {/* Friend of Friend (FOF) Recommendations Section */}
            <section className="bg-gradient-to-r from-sky-50 to-indigo-50 rounded-2xl border border-sky-200/50 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col items-center text-center gap-2 mb-8">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span className="text-2xl">✨</span> Friend of Friend Recommendations
              </h1>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                Expand your network! These students share 2 or more mutual friends with you.
              </p>
            </section>

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
              <div className="w-full rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center text-center p-12 shadow-sm">
                <span className="text-4xl mb-4 opacity-50">🕸️</span>
                <h3 className="text-base font-extrabold text-slate-950">No Recommendations Yet</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
                  You need to connect with more people before we can suggest friends of friends.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {fofCandidates.map((fof, idx) => (
                  <div key={idx} className="bg-white hover:border-sky-300 transition-colors border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col group relative overflow-hidden">
                    <div className="flex items-center gap-4">
                      <img 
                        src={getStudentAvatar(fof.user.name)} 
                        alt={fof.user.name} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-extrabold text-slate-900 truncate">
                          {fof.user.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                          {fof.user.university || 'University'}
                        </p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-sky-100 text-[9px] font-black text-sky-600">
                            {fof.mutualCount}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            Mutual Friends
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100 flex-1">
                      <p className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Shared Connections:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {fof.mutualFriends?.slice(0, 3).map((mf: any, i: number) => (
                          <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 shadow-sm font-medium">
                            {mf.name}
                          </span>
                        ))}
                        {fof.mutualFriends?.length > 3 && (
                          <span className="text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-500 font-bold">
                            +{fof.mutualFriends.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => alert(`Connection request sent to ${fof.user.name}!`)}
                      className="mt-4 w-full bg-slate-900 hover:bg-sky-600 transition-colors text-white text-xs font-bold py-2.5 rounded-xl shadow-sm"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* MATCH POPUP MODAL */}
      {matchPopup?.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-center flex flex-col items-center animate-fade-in">
            <span className="text-4xl animate-bounce mb-2">🎉</span>
            <h3 className="text-2xl font-black text-rose-500 uppercase tracking-tight">
              It&apos;s a Match!
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              You and <strong>{matchPopup.targetName}</strong> have mutual interest!
            </p>

            <div className="mt-5 flex flex-col gap-2 w-full">
              <button
                onClick={() => {
                  const targetName = matchPopup.targetName;
                  setMatchPopup(null);
                  router.push(`/messages/${encodeURIComponent(targetName)}`);
                }}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
              >
                Send Message 💬
              </button>
              <button
                onClick={() => setMatchPopup(null)}
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-xs font-bold text-slate-500 transition-colors"
              >
                Keep Swiping ✨
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Detailed Candidate Profile & Graph Modal */}
      {detailCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-all duration-300">
            {/* Modal Header / Banner */}
            <div className="relative h-44 bg-slate-900 shrink-0">
              <img
                src={detailCandidate.avatarUrl || getStudentAvatar(detailCandidate.name)}
                alt={detailCandidate.name}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <button
                onClick={() => setDetailCandidate(null)}
                className="absolute top-4 right-4 bg-slate-950/70 hover:bg-slate-950 border border-white/10 text-white h-8 w-8 rounded-full flex items-center justify-center text-sm font-black transition-all"
              >
                ✕
              </button>
              
              <div className="absolute bottom-4 left-6 text-white">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
                    {detailCandidate.name}
                  </h3>
                  <span className="text-lg font-bold text-white/80 drop-shadow-md">
                    {20 + detailCandidate.year}
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
                </div>
                <p className="text-xs text-white/70 drop-shadow-sm font-bold flex items-center gap-1 mt-0.5">
                  <span>🏫</span> {detailCandidate.university}
                </p>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 select-none">
              {/* Bio & Academic Profile */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Academic Profile</h4>
                  <p className="text-xs text-rose-600 font-extrabold mt-1 flex items-center gap-1.5">
                    <span>🎓</span>
                    <span>{detailCandidate.major} (Faculty of {FACULTY_MAP[detailCandidate.major] || 'Computing'})</span>
                  </p>
                </div>
                
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Bio Statement</h4>
                  <p className="text-xs text-slate-700 italic mt-1 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    "{detailCandidate.bio}"
                  </p>
                </div>
              </div>

              {/* Neo4j Relationship Orbit Visualizer */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="text-xs">🌌</span> Neo4j Graph Orbit Visualization
                  </h4>
                  <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md">
                    Real-time Graph Query
                  </span>
                </div>

                {loadingRelation ? (
                  <div className="h-[260px] w-full bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center gap-3 animate-pulse">
                    <span className="text-2xl animate-spin">🌌</span>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider">Querying Neo4j Auradb Path Nodes...</span>
                  </div>
                ) : relationData ? (
                  <>
                    {/* SVG Relationship Tree representation */}
                    <div className="relative">
                      <svg viewBox="0 0 400 260" className="w-full bg-slate-900 rounded-2xl border border-slate-800 shadow-inner p-2">
                        <defs>
                          <filter id="glow-rose-modal" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                          <filter id="glow-blue-modal" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>
                        
                        {(() => {
                          const middleNodes: { label: string; type: string; color: string; val: string }[] = [];
                          const shareMajor = relationData.meMajor && relationData.otherMajor && relationData.meMajor.name === relationData.otherMajor.name;
                          if (shareMajor) {
                            middleNodes.push({ label: 'STUDIES', type: 'Major', color: '#7c3aed', val: relationData.meMajor.name });
                          }
                          if (relationData.sharedCourses) {
                            relationData.sharedCourses.forEach((c: any) => {
                              middleNodes.push({ label: 'TAKES', type: 'Course', color: '#059669', val: c.code || c.name });
                            });
                          }
                          if (relationData.sharedHobbies) {
                            relationData.sharedHobbies.forEach((h: any) => {
                              middleNodes.push({ label: 'LIKES', type: 'Hobby', color: '#d97706', val: h.name });
                            });
                          }
                          if (relationData.mutualFriends) {
                            relationData.mutualFriends.forEach((f: any) => {
                              middleNodes.push({ label: 'CONNECTED', type: 'Friend', color: '#0284c7', val: f.name });
                            });
                          }

                          const displayNodes = middleNodes.slice(0, 4);
                          const extraCount = middleNodes.length - displayNodes.length;

                          if (middleNodes.length === 0) {
                            return (
                              <g>
                                <line x1="50" y1="130" x2="350" y2="130" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4,4" />
                                <text x="200" y="120" fill="#64748b" fontSize="9" textAnchor="middle" fontWeight="bold">NO DIRECT PARITY PATHS</text>
                                <text x="200" y="135" fill="#475569" fontSize="8" textAnchor="middle">Relationships will unlock upon match</text>
                                
                                {/* You Node */}
                                <g>
                                  <circle cx="50" cy="130" r="20" fill="#f43f5e" filter="url(#glow-rose-modal)" />
                                  <circle cx="50" cy="130" r="16" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                                  <text x="50" y="134" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">ME</text>
                                  <text x="50" y="165" fill="#f43f5e" fontSize="9" fontWeight="black" textAnchor="middle">You</text>
                                </g>
                                
                                {/* Them Node */}
                                <g>
                                  <circle cx="350" cy="130" r="20" fill="#0ea5e9" filter="url(#glow-blue-modal)" />
                                  <circle cx="350" cy="130" r="16" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2" />
                                  <text x="350" y="134" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">THEM</text>
                                  <text x="350" y="165" fill="#0ea5e9" fontSize="9" fontWeight="black" textAnchor="middle">{detailCandidate.name}</text>
                                </g>
                              </g>
                            );
                          }

                          return (
                            <g>
                              {/* Lines / Edges */}
                              {displayNodes.map((node, idx) => {
                                const ny = displayNodes.length === 1 ? 130 : 40 + idx * (180 / (displayNodes.length - 1));
                                return (
                                  <g key={`edges-modal-${idx}`}>
                                    {/* You to Middle */}
                                    <line x1="50" y1="130" x2="200" y2={ny} stroke="rgba(148, 163, 184, 0.35)" strokeWidth="2" strokeDasharray="3,3" />
                                    {/* Middle to Them */}
                                    <line x1="200" y1={ny} x2="350" y2="130" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="2" strokeDasharray="3,3" />
                                    
                                    {/* Relationship labels */}
                                    <text x="110" y={ny + (130 - ny) * 0.5 - 5} fill="#64748b" fontSize="7" fontWeight="black" textAnchor="middle">
                                      {node.label}
                                    </text>
                                    <text x="290" y={ny + (130 - ny) * 0.5 - 5} fill="#64748b" fontSize="7" fontWeight="black" textAnchor="middle">
                                      {node.label}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Middle Nodes */}
                              {displayNodes.map((node, idx) => {
                                const ny = displayNodes.length === 1 ? 130 : 40 + idx * (180 / (displayNodes.length - 1));
                                return (
                                  <g key={`node-modal-${idx}`}>
                                    <circle cx="200" cy={ny} r="13" fill={node.color} stroke="#0f172a" strokeWidth="2.5" />
                                    <text x="200" y={ny + 3.5} fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle">
                                      {node.type[0]}
                                    </text>
                                    <text x="200" y={ny - 16} fill="#f8fafc" fontSize="9" fontWeight="extrabold" textAnchor="middle">
                                      {node.val}
                                    </text>
                                    <text x="200" y={ny + 24} fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">
                                      {node.type}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* You Node */}
                              <g>
                                <circle cx="50" cy="130" r="20" fill="#f43f5e" filter="url(#glow-rose-modal)" />
                                <circle cx="50" cy="130" r="16" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                                <text x="50" y="134" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">ME</text>
                                <text x="50" y="165" fill="#f43f5e" fontSize="9" fontWeight="black" textAnchor="middle">You</text>
                              </g>
                              
                              {/* Them Node */}
                              <g>
                                <circle cx="350" cy="130" r="20" fill="#0ea5e9" filter="url(#glow-blue-modal)" />
                                <circle cx="350" cy="130" r="16" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2" />
                                <text x="350" y="134" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">THEM</text>
                                <text x="350" y="165" fill="#0ea5e9" fontSize="9" fontWeight="black" textAnchor="middle">{detailCandidate.name}</text>
                              </g>

                              {/* Extra connection counter label */}
                              {extraCount > 0 && (
                                <text x="200" y="245" fill="#a8a29e" fontSize="8" fontWeight="black" textAnchor="middle">
                                  + {extraCount} MORE GRAPH PATH CONNECTIONS
                                </text>
                              )}
                            </g>
                          );
                        })()}
                      </svg>
                    </div>

                    {/* Detailed connections items */}
                    <div className="space-y-2 mt-2">
                      {relationData.meMajor && relationData.otherMajor && relationData.meMajor.name === relationData.otherMajor.name && (
                        <div className="flex items-center gap-2.5 text-xs bg-violet-50 text-violet-700 border border-violet-100 px-3.5 py-2.5 rounded-xl">
                          <span className="text-base">🎓</span>
                          <span>Both studies <strong>{relationData.meMajor.name}</strong> under the Faculty of <strong>{relationData.meMajor.faculty}</strong>.</span>
                        </div>
                      )}
                      {relationData.sharedCourses && relationData.sharedCourses.length > 0 && (
                        <div className="flex items-center gap-2.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-3.5 py-2.5 rounded-xl">
                          <span className="text-base">📚</span>
                          <span>Enrolled in the same courses: <strong>{relationData.sharedCourses.map((c: any) => c.code || c.name).join(', ')}</strong>.</span>
                        </div>
                      )}
                      {relationData.sharedHobbies && relationData.sharedHobbies.length > 0 && (
                        <div className="flex items-center gap-2.5 text-xs bg-amber-50 text-amber-700 border border-amber-100 px-3.5 py-2.5 rounded-xl">
                          <span className="text-base">❤️</span>
                          <span>Share mutual hobbies: <strong>{relationData.sharedHobbies.map((h: any) => h.name).join(', ')}</strong>.</span>
                        </div>
                      )}
                      {relationData.mutualFriends && relationData.mutualFriends.length > 0 && (
                        <div className="flex items-center gap-2.5 text-xs bg-sky-50 text-sky-700 border border-sky-100 px-3.5 py-2.5 rounded-xl">
                          <span className="text-base">🤝</span>
                          <span>Connected with <strong>{relationData.mutualFriends.length}</strong> mutual classmates: <strong>{relationData.mutualFriends.map((f: any) => f.name).join(', ')}</strong>.</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                    Failed to fetch relation path data.
                  </div>
                )}
              </div>
            </div>

            {/* Direct Swipe Action buttons */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-around gap-4 shrink-0">
              <button
                onClick={() => {
                  setDetailCandidate(null);
                  swipe('left');
                }}
                className="flex items-center justify-center gap-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-500 text-xs font-black tracking-wider uppercase px-6 py-3 rounded-2xl shadow-sm hover:scale-[1.03] active:scale-[0.97] transition-all flex-1"
              >
                ✕ Skip
              </button>
              
              <button
                onClick={() => {
                  setDetailCandidate(null);
                  swipe('up');
                }}
                className="flex items-center justify-center gap-2 bg-white border border-sky-200 hover:bg-sky-50 text-sky-500 text-xs font-black tracking-wider uppercase px-4 py-3 rounded-2xl shadow-sm hover:scale-[1.03] active:scale-[0.97] transition-all"
                title="Super Like"
              >
                ★ Super
              </button>

              <button
                onClick={() => {
                  setDetailCandidate(null);
                  swipe('right');
                }}
                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 text-white text-xs font-black tracking-wider uppercase px-6 py-3 rounded-2xl shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all flex-1"
              >
                ❤️ Spark Match
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
