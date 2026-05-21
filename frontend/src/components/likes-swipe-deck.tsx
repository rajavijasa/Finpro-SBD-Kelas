'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction, recordSwipeAction } from '@/app/actions/auth';
import type { LikedMeCandidate } from '@/app/actions/auth';

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

interface LikesSwipeDeckProps {
  currentUser: string;
  likedMeDeck: LikedMeCandidate[];
}

export default function LikesSwipeDeck({ currentUser, likedMeDeck }: LikesSwipeDeckProps) {
  const router = useRouter();
  const [candidates] = useState(likedMeDeck);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [matchPopup, setMatchPopup] = useState<{ show: boolean; targetName: string } | null>(null);

  // Gesture states
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flyOutDirection, setFlyOutDirection] = useState<'left' | 'right' | 'up' | null>(null);

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
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-white font-bold text-sm shadow-sm">
                C
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-extrabold tracking-tight text-slate-900">CampusCircle</span>
                <span className="text-[10px] font-bold text-pink-500 tracking-wider uppercase">Likes</span>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-pink-500/10 px-3 py-1.5 rounded-xl border border-pink-500/10">
              <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">Active:</span>
              <span className="text-xs font-black text-slate-900">{currentUser} 💘</span>
            </div>

            <a
              href="/"
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 font-extrabold text-xs px-3.5 py-2 rounded-xl cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              ← Back to Discover
            </a>

            <button
              onClick={() => logoutAction()}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 transition-colors text-white font-extrabold text-xs px-3.5 py-2 rounded-xl cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign Out 🚪
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 mt-8">

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
                          {20 + card.year}
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
    </div>
  );
}
