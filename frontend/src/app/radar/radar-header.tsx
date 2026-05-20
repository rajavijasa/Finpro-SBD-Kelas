import Link from "next/link";

interface RadarHeaderProps {
  currentUser: string;
}

export function RadarHeader({ currentUser }: RadarHeaderProps) {

  return (
    <header className="z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <Link 
          href={`/?userName=${currentUser}`}
          className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 transition-colors text-white font-extrabold text-base shadow-lg shadow-rose-500/20"
        >
          C
        </Link>
        <div>
          <div className="flex items-baseline gap-1.5">
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900">
              CampusCircle Nebula Radar
            </h1>
            <span className="text-[9px] font-bold text-rose-600 tracking-wider uppercase bg-rose-500/10 px-1.5 py-0.5 rounded">
              Universal View
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Real-time interactive rendering of all 1000+ student social orbits & academic hubs
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center">
        {/* Active Authenticated Node Indicator */}
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-100/80 px-3.5 py-2 rounded-xl text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-slate-500">Highlighted Node:</span>
          <span className="text-slate-900 font-black">{currentUser} 🔴</span>
        </div>

        {/* Back Button */}
        <Link
          href="/"
          className="bg-slate-950 hover:bg-slate-900 active:scale-95 transition-all text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md"
        >
          Back to Match App
        </Link>
      </div>
    </header>
  );
}
