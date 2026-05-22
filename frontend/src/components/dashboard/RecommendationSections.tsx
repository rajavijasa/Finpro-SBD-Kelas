import { MutualClassResult, HobbyClusterResult, FofResult } from "@/lib/types";
import { getStudentAvatar } from "@/lib/utils";

interface RecommendationSectionsProps {
  mutualMatches: MutualClassResult[];
  hobbyMatches: HobbyClusterResult[];
  fofMatches: FofResult[];
  loadingMutual: boolean;
  loadingHobby: boolean;
  loadingFof: boolean;
  onConnect: (name: string) => void;
}

export function RecommendationSections({
  mutualMatches,
  hobbyMatches,
  fofMatches,
  loadingMutual,
  loadingHobby,
  loadingFof,
  onConnect
}: RecommendationSectionsProps) {
  return (
    <div className="mt-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mutual Class Finder */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)] flex flex-col h-full">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1 flex items-center gap-2">
            <span>📚</span> Mutual Class Finder
          </h3>
          <p className="text-xs text-slate-500 mb-4">Peers who share the exact same courses but are not yet connected.</p>

          {loadingMutual ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 items-center p-3 border border-slate-100 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : mutualMatches.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl">
              <span className="text-2xl mb-2 opacity-50">🎒</span>
              <span className="text-xs font-bold text-slate-500">No mutual classmates found</span>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {mutualMatches.map((match, idx) => (
                <div key={`${match.user.name}-${idx}`} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-slate-300 transition-colors bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <img src={getStudentAvatar(match.user.name)} alt={match.user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{match.user.name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.sharedCourses.map((course, cIdx) => (
                          <span key={`${course.code}-${cIdx}`} className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {course.code}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onConnect(match.user.name)} 
                    className="text-[10px] font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hobby Clusters */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)] flex flex-col h-full">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1 flex items-center gap-2">
            <span>🎯</span> Hobby Clusters
          </h3>
          <p className="text-xs text-slate-500 mb-4">Discover students clustered by your shared interests and hobbies.</p>

          {loadingHobby ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map(i => (
                <div key={i} className="border border-slate-100 rounded-xl p-3">
                  <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : hobbyMatches.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl">
              <span className="text-2xl mb-2 opacity-50">🎮</span>
              <span className="text-xs font-bold text-slate-500">No hobby clusters found</span>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {Object.entries(
                hobbyMatches.reduce((acc, curr) => {
                  const hName = curr.hobby.name || 'Unknown';
                  if (!acc[hName]) acc[hName] = [];
                  acc[hName].push(curr);
                  return acc;
                }, {} as Record<string, HobbyClusterResult[]>)
              ).map(([hobbyName, matches], groupIdx) => (
                <div key={`${hobbyName}-${groupIdx}`} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">
                      {hobbyName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {matches.length} Member{matches.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {matches.map((m, idx) => (
                      <div key={`${m.user.name}-${idx}`} className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-sm" title={m.major?.name}>
                        <img src={getStudentAvatar(m.user.name)} alt={m.user.name} className="w-5 h-5 rounded-full object-cover" />
                        <span className="text-[10px] font-bold text-slate-700">{m.user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Friends of Friends (Single Column Full Width) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
        <h3 className="text-sm font-extrabold text-slate-900 mb-1 flex items-center gap-2">
          <span>🤝</span> People You May Know
        </h3>
        <p className="text-xs text-slate-500 mb-4">Connections through mutual friends in your orbit.</p>
        
        {loadingFof ? (
          <div className="flex gap-4 animate-pulse overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-48 h-24 border border-slate-100 rounded-xl shrink-0 bg-slate-50/50"></div>
            ))}
          </div>
        ) : fofMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-xl">
             <span className="text-2xl mb-2 opacity-50">🕸️</span>
             <span className="text-xs font-bold text-slate-500">Connect with more people to unlock FoF recommendations</span>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {fofMatches.map((fof, idx) => (
              <div key={`${fof.user.name}-${idx}`} className="w-64 shrink-0 p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:border-slate-300 transition-all group">
                <div className="flex items-center gap-3">
                  <img src={getStudentAvatar(fof.user.name)} alt={fof.user.name} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate">{fof.user.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{fof.mutualCount} Mutual Friends</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-1 flex-wrap">
                  {fof.mutualFriends.slice(0, 2).map((friend, fIdx) => (
                    <span key={fIdx} className="text-[8px] bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
                      {friend}
                    </span>
                  ))}
                  {fof.mutualFriends.length > 2 && <span className="text-[8px] text-slate-400 font-bold">+{fof.mutualFriends.length - 2}</span>}
                </div>
                <button 
                  onClick={() => onConnect(fof.user.name)}
                  className="mt-4 w-full bg-slate-900 text-white text-[9px] font-black uppercase py-2 rounded-lg hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
                >
                  Spark Connect ⚡
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
