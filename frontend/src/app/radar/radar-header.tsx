'use client';

import { useRouter } from "next/navigation";
import Link from "next/link";

interface RadarHeaderProps {
  currentUser: string;
  allUsers: string[];
}

export function RadarHeader({ currentUser, allUsers }: RadarHeaderProps) {
  const router = useRouter();

  const handleUserChange = (newUser: string) => {
    router.push(`/radar?userName=${newUser}`);
  };

  return (
    <header className="z-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 shadow-lg">
      <div className="flex items-center gap-3">
        <Link 
          href={`/?userName=${currentUser}`}
          className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 transition-colors text-white font-extrabold text-base shadow-lg shadow-rose-500/20"
        >
          C
        </Link>
        <div>
          <div className="flex items-baseline gap-1.5">
            <h1 className="text-sm font-extrabold tracking-tight text-white">
              CampusCircle Nebula Radar
            </h1>
            <span className="text-[9px] font-bold text-rose-500 tracking-wider uppercase bg-rose-500/10 px-1.5 py-0.5 rounded">
              Universal View
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Real-time interactive rendering of all 1000+ student social orbits & academic hubs
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center">
        {/* Dynamic Profile Selector Dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400">
          <span>Highlight Node:</span>
          <select
            value={currentUser}
            onChange={(e) => handleUserChange(e.target.value)}
            className="bg-transparent border-none text-white font-extrabold focus:outline-none focus:ring-0 cursor-pointer pr-1"
          >
            {allUsers.map((u) => (
              <option key={u} value={u} className="bg-slate-900 text-slate-200 font-semibold">
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Back Button */}
        <Link
          href={`/?userName=${currentUser}`}
          className="bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-rose-500/10"
        >
          Back to Match App
        </Link>
      </div>
    </header>
  );
}
