'use client';

import { CampusCircleCandidat } from "@/lib/types";
import { getStudentAvatar } from "@/lib/utils";

interface SwipeCardProps {
  card: CampusCircleCandidat;
  isTop: boolean;
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  style: React.CSSProperties;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onShowDetails: (card: CampusCircleCandidat) => void;
  badge?: {
    text: string;
    icon: string;
    color: string;
  };
}

export function SwipeCard({
  card,
  isTop,
  isDragging,
  dragOffset,
  style,
  onMouseDown,
  onTouchStart,
  onShowDetails,
  badge
}: SwipeCardProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={style}
      className={`absolute w-full h-full rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.12)] bg-slate-900 select-none ${
        isTop ? 'border border-white/20' : 'border border-white/5'
      }`}
    >
      <div className="absolute inset-0 z-0">
        <img
          src={card.avatarUrl || getStudentAvatar(card.name)}
          alt={card.name}
          className="w-full h-full object-cover select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/5 pointer-events-none" />
      </div>

      {isTop && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onShowDetails(card);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute top-4 right-4 z-40 pointer-events-auto bg-black/60 hover:bg-black/85 hover:scale-105 active:scale-95 text-white border border-white/20 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1 shadow-md"
        >
          <span>🔍</span> Details & Graph
        </button>
      )}

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
            <span className="truncate">{card.major} (Faculty of {card.faculty})</span>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-white/90 font-semibold italic bg-black/40 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 leading-relaxed shadow-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          &quot;{card.bio}&quot;
        </p>

        <div className="flex flex-wrap gap-1.5 mt-3 select-none">
          {badge && (
            <span className={`${badge.color} text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-white/20 shadow-sm flex items-center gap-1`}>
              <span>{badge.icon}</span> {badge.text}
            </span>
          )}
          {(card.details.sharedCourses?.length ?? 0) > 0 && (
            <span className="bg-emerald-500/90 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-emerald-400/20 shadow-sm flex items-center gap-1">
              <span>📚</span> {card.details.sharedCourses!.length} Shared Course{card.details.sharedCourses!.length > 1 ? 's' : ''}
            </span>
          )}
          {(card.details.sharedHobbies?.length ?? 0) > 0 && (
            <span className="bg-amber-500/90 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-amber-400/20 shadow-sm flex items-center gap-1">
              <span>❤️</span> {card.details.sharedHobbies!.length} Shared Hobb{card.details.sharedHobbies!.length > 1 ? 'ies' : 'y'}
            </span>
          )}
          {(card.details.mutualFriends ?? 0) > 0 && (
            <span className="bg-blue-500/90 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-blue-400/20 shadow-sm flex items-center gap-1">
              <span>🤝</span> {card.details.mutualFriends} Mutual Friend{card.details.mutualFriends! > 1 ? 's' : ''}
            </span>
          )}
          {card.relevanceScore > 0 && (
            <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg border border-white/10 backdrop-blur-xs flex items-center gap-1">
              <span>⚡</span> Score: {card.relevanceScore}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
