'use client';

import { StudentProfile } from "@/lib/types";

interface ProfileBannerProps {
  profileData: StudentProfile;
  likedMeCount: number;
  onOpenSettings: () => void;
}

export function ProfileBanner({
  profileData,
  likedMeCount,
  onOpenSettings
}: ProfileBannerProps) {
  const { fullName, major, faculty, year, bio, hobbies, colorStyle } = profileData;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-5 items-center md:items-start transition-all duration-300">
      <div className={`h-14 w-14 rounded-full bg-gradient-to-tr ${colorStyle.bg} border flex items-center justify-center text-xl font-bold ${colorStyle.text} shrink-0 shadow-sm`}>
        {fullName[0]}
      </div>

      <div className="flex-1 text-center md:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{fullName}</h2>
            {likedMeCount > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce shadow-sm">
                {likedMeCount} LIKES! 💘
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 justify-center">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
              {major}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
              {faculty}
            </span>
            <span className="rounded-md bg-slate-200/60 px-2 py-0.5 text-[9px] font-bold text-slate-700">
              Year {year}
            </span>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500 italic max-w-2xl leading-relaxed">
          &quot;{bio}&quot;
        </p>

        <div className="mt-4 border-t border-slate-100 pt-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 items-center justify-center md:justify-start text-[11px] text-slate-500 font-semibold">
            <span>My Registered Hobbies:</span>
            {hobbies.map((hob) => (
              <span key={hob} className="rounded-md bg-rose-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-rose-600 border border-rose-100/50">
                {hob}
              </span>
            ))}
          </div>
          <button 
            onClick={onOpenSettings}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 shadow-xs hover:shadow-sm"
          >
            <span>⚙️</span> Edit Orbits
          </button>
        </div>
      </div>
    </section>
  );
}
