'use client';

import { USER_PROFILES, COLORS } from "@/lib/constants";

interface MatchPopupProps {
  targetName: string;
  onClose: () => void;
  onChat: (name: string) => void;
}

export function MatchPopup({
  targetName,
  onClose,
  onChat
}: MatchPopupProps) {
  const targetProfile = USER_PROFILES[targetName];
  const charSum = targetName.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const targetColor = targetProfile?.colorStyle || COLORS[charSum % COLORS.length];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-center flex flex-col items-center animate-fade-in">
        <span className="text-4xl animate-bounce mb-2">🎉</span>
        <h3 className="text-2xl font-black text-rose-500 uppercase tracking-tight">
          It&apos;s a Match!
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          You and <strong>{targetName}</strong> have sparked mutual interest!
        </p>

        <div className="mt-6 flex items-center justify-center gap-5 relative">
          <div className="relative">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-black text-white border">
              ME
            </div>
          </div>

          <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-200 shadow-sm">
            <svg className="h-4.5 w-4.5 text-rose-500 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          <div className="relative">
            <div className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr ${targetColor.bg} text-lg font-black ${targetColor.text} border`}>
              {targetName[0]}
            </div>
          </div>
        </div>

        <p className="mt-6 text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100 w-full text-center">
          💡 Classmate Spark: Dropping a quick message or saying hello next time you see them on campus is highly recommended!
        </p>

        <div className="mt-5 flex flex-col gap-2 w-full">
          <button
            onClick={() => onChat(targetName)}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
          >
            Send Message 💬
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-xs font-bold text-slate-500 transition-colors"
          >
            Keep Swiping ✨
          </button>
        </div>
      </div>
    </div>
  );
}
