'use client';

import { CampusCircleCandidat, RelationGraphData } from "@/lib/types";
import { getStudentAvatar } from "@/lib/utils";
import { FACULTY_MAP } from "@/lib/constants";
import { useCandidateRelation } from "@/hooks/useCandidateRelation";

interface CandidateDetailModalProps {
  currentUser: string;
  candidate: CampusCircleCandidat;
  onClose: () => void;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
}

export function CandidateDetailModal({
  currentUser,
  candidate,
  onClose,
  onSwipe
}: CandidateDetailModalProps) {
  const { data: relationData, loading: loadingRelation } = useCandidateRelation(currentUser, candidate.name);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-all duration-300">
        <div className="relative h-44 bg-slate-900 shrink-0">
          <img
            src={candidate.avatarUrl || getStudentAvatar(candidate.name)}
            alt={candidate.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-slate-950/70 hover:bg-slate-950 border border-white/10 text-white h-8 w-8 rounded-full flex items-center justify-center text-sm font-black transition-all"
          >
            ✕
          </button>

          <div className="absolute bottom-4 left-6 text-white">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
                {candidate.name}
              </h3>
              <span className="text-lg font-bold text-white/80 drop-shadow-md">
                {20 + candidate.year}
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>
            <p className="text-xs text-white/70 drop-shadow-sm font-bold flex items-center gap-1 mt-0.5">
              <span>🏫</span> {candidate.university}
            </p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1 select-none">
          <div className="space-y-3">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Academic Profile</h4>
              <p className="text-xs text-rose-600 font-extrabold mt-1 flex items-center gap-1.5">
                <span>🎓</span>
                <span>{candidate.major} (Faculty of {candidate.faculty || FACULTY_MAP[candidate.major] || 'Computing'})</span>
              </p>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Bio Statement</h4>
              <p className="text-xs text-slate-700 italic mt-1 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-xl">
                &quot;{candidate.bio}&quot;
              </p>
            </div>
          </div>

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
                <div className="relative">
                   <RelationshipGraphSvg relationData={relationData} candidateName={candidate.name} />
                </div>

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
                      <span>Enrolled in the same courses: <strong>{relationData.sharedCourses.map((c) => c.code || c.name).join(', ')}</strong>.</span>
                    </div>
                  )}
                  {relationData.sharedHobbies && relationData.sharedHobbies.length > 0 && (
                    <div className="flex items-center gap-2.5 text-xs bg-amber-50 text-amber-700 border border-amber-100 px-3.5 py-2.5 rounded-xl">
                      <span className="text-base">❤️</span>
                      <span>Share mutual hobbies: <strong>{relationData.sharedHobbies.map((h) => h.name).join(', ')}</strong>.</span>
                    </div>
                  )}
                  {relationData.mutualFriends && relationData.mutualFriends.length > 0 && (
                    <div className="flex items-center gap-2.5 text-xs bg-sky-50 text-sky-700 border border-sky-100 px-3.5 py-2.5 rounded-xl">
                      <span className="text-base">🤝</span>
                      <span>Connected with <strong>{relationData.mutualFriends.length}</strong> mutual classmates: <strong>{relationData.mutualFriends.map((f) => f.name).join(', ')}</strong>.</span>
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

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-around gap-4 shrink-0">
          <button
            onClick={() => { onClose(); onSwipe('left'); }}
            className="flex items-center justify-center gap-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-500 text-xs font-black tracking-wider uppercase px-6 py-3 rounded-2xl shadow-sm hover:scale-[1.03] active:scale-[0.97] transition-all flex-1"
          >
            ✕ Skip
          </button>

          <button
            onClick={() => { onClose(); onSwipe('up'); }}
            className="flex items-center justify-center gap-2 bg-white border border-sky-200 hover:bg-sky-50 text-sky-500 text-xs font-black tracking-wider uppercase px-4 py-3 rounded-2xl shadow-sm hover:scale-[1.03] active:scale-[0.97] transition-all"
            title="Super Like"
          >
            ★ Super
          </button>

          <button
            onClick={() => { onClose(); onSwipe('right'); }}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 text-white text-xs font-black tracking-wider uppercase px-6 py-3 rounded-2xl shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all flex-1"
          >
            ❤️ Spark Match
          </button>
        </div>
      </div>
    </div>
  );
}

function RelationshipGraphSvg({ relationData, candidateName }: { relationData: RelationGraphData; candidateName: string }) {
  const middleNodes: { label: string; type: string; color: string; val: string }[] = [];
  const shareMajor = relationData.meMajor && relationData.otherMajor && relationData.meMajor.name === relationData.otherMajor.name;
  if (shareMajor) {
    middleNodes.push({ label: 'STUDIES', type: 'Major', color: '#7c3aed', val: relationData.meMajor!.name! });
  }
  if (relationData.sharedCourses) {
    relationData.sharedCourses.forEach((c) => {
      middleNodes.push({ label: 'TAKES', type: 'Course', color: '#059669', val: (c.code || c.name)! });
    });
  }
  if (relationData.sharedHobbies) {
    relationData.sharedHobbies.forEach((h) => {
      middleNodes.push({ label: 'LIKES', type: 'Hobby', color: '#d97706', val: h.name! });
    });
  }
  if (relationData.mutualFriends) {
    relationData.mutualFriends.forEach((f) => {
      middleNodes.push({ label: 'CONNECTED', type: 'Friend', color: '#0284c7', val: f.name });
    });
  }

  const displayNodes = middleNodes.slice(0, 4);
  const extraCount = middleNodes.length - displayNodes.length;

  return (
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

      {middleNodes.length === 0 ? (
        <g>
          <line x1="50" y1="130" x2="350" y2="130" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4,4" />
          <text x="200" y="120" fill="#64748b" fontSize="9" textAnchor="middle" fontWeight="bold">NO DIRECT PARITY PATHS</text>
          <text x="200" y="135" fill="#475569" fontSize="8" textAnchor="middle">Relationships will unlock upon match</text>
          <NodePoint x={50} y={130} label="ME" subLabel="You" color="#f43f5e" filter="url(#glow-rose-modal)" />
          <NodePoint x={350} y={130} label="THEM" subLabel={candidateName} color="#0ea5e9" filter="url(#glow-blue-modal)" />
        </g>
      ) : (
        <g>
          {displayNodes.map((node, idx) => {
            const ny = displayNodes.length === 1 ? 130 : 40 + idx * (180 / (displayNodes.length - 1));
            return (
              <g key={idx}>
                <line x1="50" y1="130" x2="200" y2={ny} stroke="rgba(148, 163, 184, 0.35)" strokeWidth="2" strokeDasharray="3,3" />
                <line x1="200" y1={ny} x2="350" y2="130" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="2" strokeDasharray="3,3" />
                <text x="110" y={ny + (130 - ny) * 0.5 - 5} fill="#64748b" fontSize="7" fontWeight="black" textAnchor="middle">{node.label}</text>
                <text x="290" y={ny + (130 - ny) * 0.5 - 5} fill="#64748b" fontSize="7" fontWeight="black" textAnchor="middle">{node.label}</text>
                <g>
                  <circle cx="200" cy={ny} r="13" fill={node.color} stroke="#0f172a" strokeWidth="2.5" />
                  <text x="200" y={ny + 3.5} fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle">{node.type[0]}</text>
                  <text x="200" y={ny - 16} fill="#f8fafc" fontSize="9" fontWeight="extrabold" textAnchor="middle">{node.val}</text>
                  <text x="200" y={ny + 24} fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">{node.type}</text>
                </g>
              </g>
            );
          })}
          <NodePoint x={50} y={130} label="ME" subLabel="You" color="#f43f5e" filter="url(#glow-rose-modal)" />
          <NodePoint x={350} y={130} label="THEM" subLabel={candidateName} color="#0ea5e9" filter="url(#glow-blue-modal)" />
          {extraCount > 0 && <text x="200" y="245" fill="#a8a29e" fontSize="8" fontWeight="black" textAnchor="middle">+ {extraCount} MORE GRAPH PATH CONNECTIONS</text>}
        </g>
      )}
    </svg>
  );
}

function NodePoint({ x, y, label, subLabel, color, filter }: { x: number; y: number; label: string; subLabel: string; color: string; filter?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="20" fill={color} filter={filter} />
      <circle cx={x} cy={y} r="16" fill={color} stroke="#ffffff" strokeWidth="2" />
      <text x={x} y={y + 4} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">{label}</text>
      <text x={x} y={y + 35} fill={color} fontSize="9" fontWeight="black" textAnchor="middle">{subLabel}</text>
    </g>
  );
}
