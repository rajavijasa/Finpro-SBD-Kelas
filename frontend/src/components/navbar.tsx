'use client';

import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import { useEffect, useState, useCallback } from 'react';
import { fetchLikedMeDeckAction } from '@/app/actions/auth';

interface NavbarProps {
  currentUser: string;
  activeTab?: 'match' | 'discover' | 'messages' | 'likes' | 'none';
  onEditOrbits?: () => void;
  likedMeCount?: number;
  onLogout?: () => void;
}

export default function Navbar({
  currentUser,
  activeTab = 'none',
  onEditOrbits,
  likedMeCount: propLikedMeCount,
  onLogout,
}: NavbarProps) {
  const [likedMeCount, setLikedMeCount] = useState(propLikedMeCount ?? 0);

  const fetchCount = useCallback(async (signal: AbortSignal) => {
    try {
      const deck = await fetchLikedMeDeckAction(currentUser);
      if (signal.aborted) return;
      setLikedMeCount(deck.length);
    } catch (err) {
      console.error('Failed to fetch liked me count in navbar:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (propLikedMeCount !== undefined) {
      setLikedMeCount(propLikedMeCount);
      return;
    }

    const controller = new AbortController();
    fetchCount(controller.signal);
    return () => controller.abort();
  }, [fetchCount, propLikedMeCount]);

  const navLinks = [
    { href: '/', label: '🎴 Swipe', id: 'match', colorClass: activeTab === 'match' ? 'bg-rose-500 text-white border-rose-600' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200' },
    { href: '/discover', label: '🔎 Discover', id: 'discover', colorClass: activeTab === 'discover' ? 'bg-rose-500 text-white border-rose-600' : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/60' },
    { href: '/messages', label: '💬 Messages', id: 'messages', colorClass: activeTab === 'messages' ? 'bg-rose-500 text-white border-rose-600' : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200/60' },
    { href: '/likes', label: '💘 Liked Me', id: 'likes', colorClass: activeTab === 'likes' ? 'bg-rose-500 text-white border-rose-600' : 'bg-pink-50 hover:bg-pink-100 text-pink-600 border-pink-200/50', badge: likedMeCount },
  ];

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logoutAction();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-white font-black text-sm shadow-sm">
            C
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              CampusCircle
            </span>
            <span className="text-[10px] font-bold text-rose-500 tracking-wider uppercase">
              {activeTab === 'match' ? 'Match' : activeTab === 'discover' ? 'Discover' : activeTab === 'messages' ? 'Messages' : activeTab === 'likes' ? 'Likes' : 'Space'}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/10">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Active:</span>
            <span className="text-xs font-black text-slate-900">{currentUser} ✨</span>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={`relative flex items-center gap-1 font-extrabold text-xs px-3.5 py-2 rounded-xl cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] border transition-all ${link.colorClass}`}
            >
              {link.label}
              {link.badge !== undefined && link.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white px-1 shadow-sm animate-bounce">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}

          {onEditOrbits && (
            <button
              onClick={onEditOrbits}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 font-extrabold text-xs px-3.5 py-2 rounded-xl cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              type="button"
            >
              Orbits ⚙️
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 transition-colors text-white font-extrabold text-xs px-3.5 py-2 rounded-xl cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            type="button"
          >
            Sign Out 🚪
          </button>
        </div>
      </div>
    </header>
  );
}
