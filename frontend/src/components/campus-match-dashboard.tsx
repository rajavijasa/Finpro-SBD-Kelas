'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GraphDemo } from './graph-demo';
import { logoutAction, updateProfileAction, recordSwipeAction } from '@/app/actions/auth';
import type { SwipeDeckCandidate } from '@/app/actions/auth';

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
  const idx = Math.abs(hash) % PORTRAITS.length;
  return PORTRAITS[idx];
}

export type UserSummary = {
  name: string;
  university?: string;
  year?: number;
};

export type CourseSummary = {
  subject?: string;
  code?: string;
};

export type MajorSummary = {
  name?: string;
  faculty?: string;
};

export type HobbySummary = {
  name?: string;
  category?: string;
};

export type MutualClassResult = {
  user: UserSummary;
  sharedCount: number;
  sharedCourses: CourseSummary[];
};

export type FofResult = {
  user: UserSummary;
  mutualCount: number;
  mutualFriends: UserSummary[];
};

export type HobbyClusterResult = {
  user: UserSummary;
  major: MajorSummary | null;
  hobby: HobbySummary;
};

export type StudentProfile = {
  fullName: string;
  username: string;
  phone: string | null;
  university: string | null;
  major: string | null;
  year: number | null;
  bio: string | null;
  gender: string | null;
  avatarUrl: string | null;
  courses: string[];
  hobbies: string[];
};

interface CampusMatchDashboardProps {
  currentUser: string;
  currentHobby?: string;
  mutualMatches: MutualClassResult[];
  fofMatches: FofResult[];
  hobbyMatches: HobbyClusterResult[];
  allUsers?: string[];
  swipeDeck?: SwipeDeckCandidate[];
  likedMeCount?: number;
  profileData: StudentProfile;
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

const COURSES_BY_FACULTY = {
  Computing: [
    { code: 'CS102', name: 'CS102 (Data Structures)' },
    { code: 'DB210', name: 'DB210 (Database Systems)' },
    { code: 'SE302', name: 'SE302 (Software Architecture)' },
    { code: 'AI401', name: 'AI401 (Machine Learning Intro)' },
  ],
  Engineering: [
    { code: 'ME201', name: 'ME201 (Thermodynamics)' },
    { code: 'EE110', name: 'EE110 (Basic Electrical Circuits)' },
    { code: 'CE320', name: 'CE320 (Structural Analysis)' },
    { code: 'ME305', name: 'ME305 (Fluid Mechanics)' },
  ],
  Business: [
    { code: 'PM301', name: 'PM301 (Project Management)' },
    { code: 'FN202', name: 'FN202 (Corporate Finance)' },
    { code: 'MK105', name: 'MK105 (Principles of Marketing)' },
    { code: 'BA410', name: 'BA410 (Strategic Management)' },
  ],
  'Art & Design': [
    { code: 'GD101', name: 'GD101 (Graphic Design Basics)' },
    { code: 'ID205', name: 'ID205 (Space Planning & Modeling)' },
    { code: 'DM310', name: 'DM310 (UI/UX & Web Design)' },
    { code: 'GD302', name: 'GD302 (Typography & Branding)' },
  ],
};


// Minimalistic styling configuration for demo profiles
const USER_PROFILES: Record<string, { bio: string; colorStyle: { text: string; bg: string; dot: string }; gender: 'female' | 'male'; major: string; faculty: string }> = {
  Alice: {
    bio: "Tech enthusiast, casual gamer, and pizza lover. Looking to find classmates to co-work, game, or play basketball with! 💻🎮🏀",
    colorStyle: { text: "text-rose-600", bg: "bg-rose-50 border-rose-100", dot: "bg-rose-500" },
    gender: 'female',
    major: "Information Systems",
    faculty: "Computing"
  },
  Bob: {
    bio: "Business major, startup dreamer, and epic gamer. Let's discuss business plans or carry matches in our favorite games. 📈🕹️",
    colorStyle: { text: "text-blue-600", bg: "bg-blue-50 border-blue-100", dot: "bg-blue-500" },
    gender: 'male',
    major: "Business Administration",
    faculty: "Business"
  },
  Carol: {
    bio: "Always outdoors, massive football fan, and coffee addict. Down for weekend sports or catching up on coursework. ⚽☕✨",
    colorStyle: { text: "text-fuchsia-600", bg: "bg-fuchsia-50 border-fuchsia-100", dot: "bg-fuchsia-500" },
    gender: 'female',
    major: "Information Systems",
    faculty: "Computing"
  },
  Dave: {
    bio: "Mechanical builder by day, sports player by night. Fascinated by 3D printing and competitive basketball. 🛠️🏀",
    colorStyle: { text: "text-amber-600", bg: "bg-amber-50 border-amber-100", dot: "bg-amber-500" },
    gender: 'male',
    major: "Mechanical Engineering",
    faculty: "Engineering"
  },
  Erin: {
    bio: "Freshman eager to explore campus! Passionate about gaming, running, and all things engineering. Let's connect! 🚀🎮🏃‍♀️",
    colorStyle: { text: "text-teal-600", bg: "bg-teal-50 border-teal-100", dot: "bg-teal-500" },
    gender: 'female',
    major: "Mechanical Engineering",
    faculty: "Engineering"
  },
  Frank: {
    bio: "Senior cruising through the final semester. Avid gaming fan and finance nerd. Down for multiplayer sessions or coffee talks. ☕🎮",
    colorStyle: { text: "text-violet-600", bg: "bg-violet-50 border-violet-100", dot: "bg-violet-500" },
    gender: 'male',
    major: "Business Administration",
    faculty: "Business"
  }
};

// Tinder candidates stack
interface TinderCandidate {
  name: string;
  university: string;
  year: number;
  matchType: 'class' | 'fof' | 'hobby' | 'general';
  bio: string;
  gender: 'female' | 'male';
  major: string;
  faculty: string;
  colorStyle: { text: string; bg: string; dot: string };
  relevanceScore: number;
  details: {
    courses?: CourseSummary[];
    friends?: UserSummary[];
    hobby?: HobbySummary;
    sharedCourses?: string[];
    sharedHobbies?: string[];
    mutualFriends?: number;
  };
}

export default function CampusMatchDashboard({
  currentUser,
  mutualMatches,
  fofMatches,
  hobbyMatches,
  allUsers,
  swipeDeck,
  likedMeCount,
  profileData,
}: CampusMatchDashboardProps) {
  const colors = [
    { text: "text-rose-600", bg: "bg-rose-50 border-rose-100", dot: "bg-rose-500" },
    { text: "text-blue-600", bg: "bg-blue-50 border-blue-100", dot: "bg-blue-500" },
    { text: "text-fuchsia-600", bg: "bg-fuchsia-50 border-fuchsia-100", dot: "bg-fuchsia-500" },
    { text: "text-amber-600", bg: "bg-amber-50 border-amber-100", dot: "bg-amber-500" },
    { text: "text-teal-600", bg: "bg-teal-50 border-teal-100", dot: "bg-teal-500" },
    { text: "text-violet-600", bg: "bg-violet-50 border-violet-100", dot: "bg-violet-500" }
  ];
  
  const charCodeSum = currentUser.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const pickedColor = colors[charCodeSum % colors.length];

  const myProfile = {
    bio: profileData.bio || "Campus student ready to spark connections! 🎓✨ Passionate about sharing ideas and collaborating across campus.",
    gender: (profileData.gender as 'male' | 'female') || 'female',
    major: profileData.major || 'Information Systems',
    faculty: FACULTY_MAP[profileData.major || 'Information Systems'] || 'Computing',
    colorStyle: pickedColor
  };

  const router = useRouter();
  const [showRadar, setShowRadar] = useState(true);
  const [matchPopup, setMatchPopup] = useState<{ show: boolean; targetName: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [settingsMajor, setSettingsMajor] = useState<string>('Information Systems');

  useEffect(() => {
    if (showSettings) {
      setSettingsMajor(myProfile.major || 'Information Systems');
    }
  }, [showSettings, myProfile.major]);

  const userList = allUsers && allUsers.length > 0 ? allUsers : Object.keys(USER_PROFILES);

  // Data Fetching for Dashboard Sections
  const [clientMutualMatches, setClientMutualMatches] = useState<MutualClassResult[]>(mutualMatches || []);
  const [loadingMutual, setLoadingMutual] = useState(true);

  const [clientHobbyMatches, setClientHobbyMatches] = useState<HobbyClusterResult[]>(hobbyMatches || []);
  const [loadingHobby, setLoadingHobby] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoadingMutual(true);
      setLoadingHobby(true);
      try {
        const [mutRes, hobRes] = await Promise.all([
          fetch(`/api/recommendations/mutual-classes?userName=${encodeURIComponent(currentUser)}`),
          fetch(`/api/recommendations/hobby-cluster?userName=${encodeURIComponent(currentUser)}`)
        ]);
        if (mutRes.ok) {
          setClientMutualMatches(await mutRes.json());
        }
        if (hobRes.ok) {
          setClientHobbyMatches(await hobRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch dashboard recommendations", err);
      } finally {
        setLoadingMutual(false);
        setLoadingHobby(false);
      }
    }
    fetchData();
  }, [currentUser]);

  // Swipe deck state management
  const [candidates, setCandidates] = useState<TinderCandidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [swipes, setSwipes] = useState<Record<string, 'like' | 'nope' | 'super'>>({});

  // Gesture dragging states
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flyOutDirection, setFlyOutDirection] = useState<'left' | 'right' | 'up' | null>(null);

  // Initialize swipe deck from server-provided pre-sorted candidates
  useEffect(() => {
    if (swipeDeck && swipeDeck.length > 0) {
      const compiled: TinderCandidate[] = swipeDeck.map((c) => {
        const profile = USER_PROFILES[c.name];
        const charSum = c.name.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
        const defaultColor = colors[charSum % colors.length];

        // Determine primary match type based on what they share
        let matchType: TinderCandidate['matchType'] = 'general';
        if (c.sharedCourses.length > 0) matchType = 'class';
        else if (c.sharedHobbies.length > 0) matchType = 'hobby';
        else if (c.mutualFriends > 0) matchType = 'fof';

        return {
          name: c.name,
          university: c.university,
          year: c.year,
          matchType,
          bio: profile?.bio || c.bio,
          gender: (profile?.gender || c.gender || 'female') as 'female' | 'male',
          major: profile?.major || c.major,
          faculty: profile?.faculty || c.faculty,
          colorStyle: profile?.colorStyle || defaultColor,
          relevanceScore: c.relevanceScore,
          details: {
            sharedCourses: c.sharedCourses,
            sharedHobbies: c.sharedHobbies,
            mutualFriends: c.mutualFriends,
          },
        };
      });

      setCandidates(compiled);
      setCurrentIndex(0);
      setHistory([]);
      setSwipes({});
      setDragOffset({ x: 0, y: 0 });
      setFlyOutDirection(null);
    }
  }, [swipeDeck, currentUser]);



  const handleUserChange = (newUser: string) => {
    const defaultHobbies: Record<string, string> = {
      Alice: "Gaming",
      Bob: "Gaming",
      Carol: "Football",
      Dave: "Football",
      Erin: "Gaming",
      Frank: "Gaming",
    };
    const newHobby = defaultHobbies[newUser] ?? "Gaming";
    router.push(`/?userName=${newUser}&hobbyName=${newHobby}`);
  };

  const handleHobbyChange = (newHobby: string) => {
    router.push(`/?hobbyName=${newHobby}`);
    // Break Next.js App Router client cache by triggering server re-validation
    setTimeout(() => {
      router.refresh();
    }, 50);
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdatingSettings(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateProfileAction(formData);
    setIsUpdatingSettings(false);
    if (result.success) {
      setShowSettings(false);
      router.refresh();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const swipe = async (direction: 'left' | 'right' | 'up') => {
    if (currentIndex >= candidates.length) return;

    const candidate = candidates[currentIndex];
    setFlyOutDirection(direction);

    const swipeType = direction === 'left' ? 'nope' : direction === 'right' ? 'like' : 'super';
    setSwipes(prev => ({ ...prev, [candidate.name]: swipeType }));

    // Trigger secure, parallel dual-database swipe recording
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

    const prevCandidate = candidates[prevIndex];
    if (prevCandidate) {
      setSwipes(prev => {
        const copy = { ...prev };
        delete copy[prevCandidate.name];
        return copy;
      });
    }
  };

  // Drag Gesture Handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStart || !isDragging) return;
    setDragOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragStart(null);

    if (dragOffset.x > 130) {
      swipe('right');
    } else if (dragOffset.x < -130) {
      swipe('left');
    } else if (dragOffset.y < -100) {
      swipe('up');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Mouse / Touch integration
  const onMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX, e.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) handleDragMove(e.clientX, e.clientY);
    };
    const handleGlobalMouseUp = () => {
      if (isDragging) handleDragEnd();
    };
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleGlobalTouchEnd = () => {
      if (isDragging) handleDragEnd();
    };

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
      if (diff > 2) return { display: 'none' };
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
      cursor: isDragging ? 'grabbing' : 'grab',
      zIndex: 30,
    };
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans antialiased selection:bg-rose-100 selection:text-rose-900 pb-20">
      
      {/* Sleek Minimalist Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-white font-bold text-sm shadow-sm">
              C
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                CampusCircle
              </span>
              <span className="text-[10px] font-bold text-rose-500 tracking-wider uppercase">
                Match
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Logged in User Display & Logout Button */}
            <div className="flex items-center gap-2 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/10">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Active:</span>
              <span className="text-xs font-black text-slate-900">{currentUser} ✨</span>
            </div>

            <a
              href="/likes"
              className="relative flex items-center gap-1 bg-pink-50 hover:bg-pink-100 transition-colors text-pink-600 font-extrabold text-xs px-3.5 py-2 rounded-xl cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] border border-pink-200/50"
            >
              💘 Liked Me
              {(likedMeCount ?? 0) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white px-1 shadow-sm animate-bounce">
                  {likedMeCount}
                </span>
              )}
            </a>

            <button
              onClick={() => router.push('/discover')}
              className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 transition-colors text-rose-700 font-extrabold text-xs px-3.5 py-2 rounded-xl cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] border border-rose-200/60"
              type="button"
            >
              🔎 Discover
            </button>

            <button
              onClick={() => router.push('/messages')}
              className="flex items-center gap-1 bg-sky-50 hover:bg-sky-100 transition-colors text-sky-700 font-extrabold text-xs px-3.5 py-2 rounded-xl cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] border border-sky-200/60"
              type="button"
            >
              💬 Messages
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 font-extrabold text-xs px-3.5 py-2 rounded-xl cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              Edit Orbits ⚙️
            </button>

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
        
        {/* Sleek Minimalist Banner Profile */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-5 items-center md:items-start transition-all duration-300">
          {/* Plain Solid Avatar */}
          <div className={`h-14 w-14 rounded-full bg-gradient-to-tr ${myProfile.colorStyle.bg} border flex items-center justify-center text-xl font-bold ${myProfile.colorStyle.text} shrink-0 shadow-sm`}>
            {currentUser[0]}
          </div>

          {/* Profile particulars */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{currentUser}</h2>
              <div className="flex flex-wrap gap-1 justify-center">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                  {myProfile.major}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                  {myProfile.faculty}
                </span>
                <span className="rounded-md bg-slate-200/60 px-2 py-0.5 text-[9px] font-bold text-slate-700">
                  Year {currentUser === 'Erin' ? '1' : currentUser === 'Carol' ? '3' : currentUser === 'Frank' ? '4' : '2'}
                </span>
              </div>
            </div>
            
            <p className="mt-2 text-xs text-slate-500 italic max-w-2xl leading-relaxed">
              "{myProfile.bio}"
            </p>

            {/* Hobbies Badges display from user's registered list! */}
            {profileData.hobbies.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3 flex flex-wrap gap-1.5 items-center justify-center md:justify-start text-[11px] text-slate-500 font-semibold">
                <span>My Registered Hobbies:</span>
                {profileData.hobbies.map((hob) => (
                  <span key={hob} className="rounded-md bg-rose-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-rose-600 border border-rose-100/50">
                    {hob}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Minimalist Dual Column Stacking Swiper */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Swiper Stack (Left 7 Columns) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            <div className="relative w-full max-w-[340px] h-[460px] select-none flex items-center justify-center">
              
              {currentIndex >= candidates.length ? (
                // Out of candidates screen
                <div className="w-full h-full rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center text-center p-6 shadow-sm">
                  <div className="h-16 w-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl mb-4 relative">
                    🛰️
                  </div>
                  <h3 className="text-base font-extrabold text-slate-950">Scanning Complete</h3>
                  <p className="text-xs text-slate-400 mt-2 max-w-[240px] leading-relaxed">
                    You've reviewed all direct student Sparks mapped in your Neo4j campus graph.
                  </p>
                  <div className="mt-4 text-[10px] text-slate-500 border border-dashed border-slate-200 rounded-lg p-2 max-w-[240px]">
                    💡 Swap demo profiles in the top menu to reinitialize swipe cards!
                  </div>

                  {history.length > 0 && (
                    <button
                      onClick={rewind}
                      className="mt-6 flex items-center gap-1 bg-slate-900 hover:bg-slate-800 transition-colors px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
                    >
                      🔄 Rewind Swipes
                    </button>
                  )}
                </div>
              ) : (
                // Swipe Cards stack render
                candidates.map((card, index) => {
                  if (index < currentIndex) return null;

                  const isTop = index === currentIndex;

                  return (
                    <div
                      key={`card-${card.name}-${index}`}
                      onMouseDown={isTop ? onMouseDown : undefined}
                      onTouchStart={isTop ? onTouchStart : undefined}
                      style={getCardStyle(index)}
                      className={`absolute w-full h-full rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.12)] bg-slate-900 select-none ${
                        isTop ? 'border border-white/20' : 'border border-white/5'
                      }`}
                    >
                      {/* Full-Bleed HD Stock Portrait Background */}
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={getStudentAvatar(card.name)} 
                          alt={card.name} 
                          className="w-full h-full object-cover select-none pointer-events-none"
                        />
                        {/* Perfect Real-Life Tinder Gradient Dark Fade Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/5 pointer-events-none" />
                      </div>

                      {/* Real-Life Tinder Diagonal Tilt Stamp Overlay Badges */}
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

                      {/* Glassmorphic Profile Information Panel */}
                      <div className="absolute bottom-0 left-0 right-0 z-10 p-5 flex flex-col justify-end text-white select-none pointer-events-none">
                        
                        {/* Name & Age (Year offset) */}
                        <div className="flex items-baseline gap-2">
                          <h2 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {card.name}
                          </h2>
                          <span className="text-xl font-bold text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {20 + card.year}
                          </span>
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
                        </div>

                        {/* Academics: Major & University */}
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

                        {/* Translucent Bio Prompt Card */}
                        <p className="mt-3 text-[11px] text-white/90 font-semibold italic bg-black/40 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 leading-relaxed shadow-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                          "{card.bio}"
                        </p>

                        {/* Interactive Spark Connection Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-3 select-none">
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
                })
              )}

            </div>

            {/* Iconic Real-Life Tinder Action Button Deck */}
            {currentIndex < candidates.length && (
              <div className="flex items-center justify-center gap-4 mt-6 select-none">
                
                {/* 1. REWIND BUTTON (Yellow circular border) */}
                <button
                  onClick={rewind}
                  disabled={history.length === 0}
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-400 bg-white text-amber-500 hover:bg-amber-50/50 transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-md shadow-amber-400/5"
                  title="Rewind Swipe"
                >
                  <span className="text-base">🔄</span>
                </button>

                {/* 2. NOPE / PASS BUTTON (Red X border - primary) */}
                <button
                  onClick={() => swipe('left')}
                  className="flex h-15 w-15 items-center justify-center rounded-full border-2 border-rose-500 bg-white text-rose-500 hover:bg-rose-50/50 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-rose-500/10"
                  title="Pass (Nope)"
                >
                  <span className="text-xl font-black">✕</span>
                </button>

                {/* 3. SUPER LIKE BUTTON (Cyan Star border) */}
                <button
                  onClick={() => swipe('up')}
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-sky-400 bg-white text-sky-500 hover:bg-sky-50/50 transition-all hover:scale-110 active:scale-95 shadow-md shadow-sky-400/5"
                  title="Super Like"
                >
                  <span className="text-lg">★</span>
                </button>

                {/* 4. LIKE MATCH BUTTON (Green Heart border - primary) */}
                <button
                  onClick={() => swipe('right')}
                  className="flex h-15 w-15 items-center justify-center rounded-full border-2 border-emerald-500 bg-white text-emerald-500 hover:bg-emerald-50/50 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-emerald-500/10"
                  title="Like & Match!"
                >
                  <span className="text-xl">❤️</span>
                </button>

                {/* 5. COSMIC BOOST BUTTON (Purple Lightning Bolt) */}
                <button
                  onClick={() => {
                    alert("⚡ Spark Boost Activated! Your profile exposure has increased by 10x inside the campus Nebula! 🚀🪐");
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-purple-500 bg-white text-purple-600 hover:bg-purple-50/50 transition-all hover:scale-110 active:scale-95 shadow-md shadow-purple-500/5"
                  title="Super Boost exposure!"
                >
                  <span className="text-base">⚡</span>
                </button>

              </div>
            )}

          </div>

          {/* Social Radar Nebula (Right 5 Columns) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Social Galaxy radar */}
            <div className="rounded-2xl border border-slate-900/10 bg-slate-950 p-6 shadow-2xl relative overflow-hidden group">
              {/* Stars Background Effect */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.06),transparent_60%)] pointer-events-none" />
              <div className="absolute top-0 right-0 h-40 w-40 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_70%)] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping absolute" />
                  <span className="h-2 w-2 rounded-full bg-rose-500 relative" />
                  <h3 className="text-xs font-black text-rose-500 tracking-widest uppercase">
                    Nebula Orbits Active
                  </h3>
                </div>

                <h2 className="text-xl font-extrabold text-white mt-2 leading-tight">
                  Fullscreen Social Radar
                </h2>
                
                <p className="text-[11px] text-slate-400 font-semibold mt-2.5 leading-relaxed">
                  The stardust network has grown to include <strong className="text-white">1,034 students</strong>, <strong className="text-white font-bold">34 academic majors, courses, hobbies</strong>, and <strong className="text-white">12,037 active social connections</strong>. 
                </p>
                <p className="text-[11px] text-slate-500 font-semibold mt-2 leading-relaxed">
                  Due to the cosmic scale of your campus universe, we've unlocked a dedicated fullscreen window. Pan, zoom, and inspect orbits in real-time.
                </p>

                <div className="mt-5">
                  <a
                    href={`/radar?userName=${currentUser}`}
                    className="inline-flex items-center justify-center w-full gap-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 active:scale-[0.98] transition-all text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-lg shadow-rose-500/20 group-hover:shadow-rose-500/30"
                  >
                    <span>Launch Fullscreen Radar</span>
                    <span className="text-xs group-hover:translate-x-0.5 transition-transform">🌌</span>
                  </a>
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-slate-550 font-bold uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Interactive 60fps Physics Engine Enabled</span>
                </div>
              </div>
            </div>

            {/* Quick Match stats & instructions */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-rose-500">Spark Strategy Guide 📚</h4>
              <ul className="mt-3 space-y-2 text-[11px] text-slate-500 leading-relaxed">
                <li className="flex gap-1.5">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>Tinder Swipe Stack:</strong> Swipe cards to reject/nope or like. We pull from mutual classmate courses, mutual friends, and hobbies.</span>
                </li>
                <li className="flex gap-1.5">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>Rewind history logs:</strong> Restores swiped users instantly so you never skip compatibility sparks.</span>
                </li>
                <li className="flex gap-1.5">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>Radar mapping:</strong> The graph shows how you are linked to the card candidates in 2-degree Neo4j social orbits.</span>
                </li>
              </ul>
            </div>

          </div>

        </section>

        {/* NEW SECTIONS: Mutual Classes & Hobby Cluster */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: Mutual Class Finder */}
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
            ) : clientMutualMatches.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl">
                <span className="text-2xl mb-2 opacity-50">🎒</span>
                <span className="text-xs font-bold text-slate-500">No mutual classmates found</span>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {clientMutualMatches.map((match, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-slate-300 transition-colors bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <img src={getStudentAvatar(match.user.name)} alt={match.user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900">{match.user.name}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {match.sharedCourses.map(course => (
                            <span key={course.code} className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              {course.code}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => alert(`Connection request sent to ${match.user.name}!`)} className="text-[10px] font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Hobby Cluster */}
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
            ) : clientHobbyMatches.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl">
                <span className="text-2xl mb-2 opacity-50">🎮</span>
                <span className="text-xs font-bold text-slate-500">No hobby clusters found</span>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {Object.entries(
                  clientHobbyMatches.reduce((acc, curr) => {
                    const hName = curr.hobby.name || 'Unknown';
                    if (!acc[hName]) acc[hName] = [];
                    acc[hName].push(curr);
                    return acc;
                  }, {} as Record<string, HobbyClusterResult[]>)
                ).map(([hobbyName, matches]) => (
                  <div key={hobbyName} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 hover:border-slate-300 transition-colors">
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
                        <div key={idx} className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-sm" title={m.major?.name}>
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

      </main>

      {/* MATCH POPUP MODAL */}
      {matchPopup?.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-center flex flex-col items-center animate-fade-in">
            
            <span className="text-4xl animate-bounce mb-2">🎉</span>
            <h3 className="text-2xl font-black text-rose-500 uppercase tracking-tight">
              It's a Match!
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              You and <strong>{matchPopup.targetName}</strong> have sparked mutual interest!
            </p>

            {/* Avatars side-by-side with heart between them */}
            <div className="mt-6 flex items-center justify-center gap-5 relative">
              <div className="relative">
                <div className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr ${myProfile.colorStyle.bg} text-lg font-black ${myProfile.colorStyle.text} border`}>
                  {currentUser[0]}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-slate-100 border border-slate-200 rounded px-1 text-[8px] font-bold text-slate-500">
                  You
                </div>
              </div>

              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-200 shadow-sm">
                <svg className="h-4 w-4 text-rose-500 fill-current animate-ping absolute" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <svg className="h-4.5 w-4.5 text-rose-500 fill-current relative" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>

              <div className="relative">
                <div className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr ${(USER_PROFILES[matchPopup.targetName] ?? { colorStyle: { bg: 'bg-slate-50 border-slate-100', text: 'text-slate-600' } }).colorStyle.bg} text-lg font-black ${(USER_PROFILES[matchPopup.targetName] ?? { colorStyle: { bg: 'bg-slate-50 border-slate-100', text: 'text-slate-600' } }).colorStyle.text} border`}>
                  {matchPopup.targetName[0]}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-slate-100 border border-slate-200 rounded px-1 text-[8px] font-bold text-slate-500">
                  {matchPopup.targetName}
                </div>
              </div>
            </div>

            <p className="mt-6 text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100 w-full text-center">
              💡 Classmate Spark: Dropping a quick message or saying hello next time you see them on campus is highly recommended!
            </p>

            {/* Modal Actions */}
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

      {/* Sleek Glassmorphic Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md px-6 py-12 overflow-y-auto">
          
          <div className="w-full max-w-lg bg-white border border-slate-200 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500 text-white font-bold text-xs shadow-sm">⚙️</span>
                <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Configure Your Orbits</span>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-650 font-extrabold text-xs bg-slate-100 px-2.5 py-1 rounded-lg"
              >
                Close ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-left">
              
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Academic Major</label>
                <select 
                  name="major"
                  value={settingsMajor}
                  onChange={(e) => setSettingsMajor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer"
                >
                  {Object.keys(FACULTY_MAP).map(maj => (
                    <option key={maj} value={maj}>{maj}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Academic Year</label>
                  <select 
                    name="year"
                    defaultValue={profileData.year || 2}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Contact Phone</label>
                  <input 
                    type="text" 
                    name="phone"
                    defaultValue={profileData.phone || ''}
                    placeholder="+62..." 
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Bio statement</label>
                <textarea 
                  name="bio"
                  rows={2}
                  defaultValue={profileData.bio || ''}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none resize-none"
                />
              </div>

              {/* Multi-select relationships */}
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Select Enrolled Courses ({(FACULTY_MAP[settingsMajor] ?? 'Computing')} Faculty Relations)
                </label>
                <div key={settingsMajor} className="grid grid-cols-2 gap-2">
                  {(COURSES_BY_FACULTY[FACULTY_MAP[settingsMajor] ?? 'Computing'] ?? COURSES_BY_FACULTY.Computing).map((course) => (
                    <label key={course.code} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-700 cursor-pointer hover:border-rose-500/30 transition-colors">
                      <input type="checkbox" name="courses" value={course.code} defaultChecked={profileData.courses.includes(course.code)} className="accent-rose-500" />
                      <span>{course.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Hobbies (LIKES Graph Relations)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'Chess', label: 'Chess ♟️' },
                    { value: 'Coding', label: 'Coding 💻' },
                    { value: 'Cooking', label: 'Cooking 🍳' },
                    { value: 'Football', label: 'Football ⚽' },
                    { value: 'Photography', label: 'Photography 📷' },
                    { value: 'Basketball', label: 'Basketball 🏀' },
                    { value: 'Hiking', label: 'Hiking 🥾' },
                    { value: 'Music Production', label: 'Music Prod 🎵' },
                    { value: 'Yoga', label: 'Yoga 🧘' },
                  ].map((hobby) => (
                    <label key={hobby.value} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-[9px] text-slate-700 cursor-pointer hover:border-rose-500/30 transition-colors">
                      <input type="checkbox" name="hobbies" value={hobby.value} defaultChecked={profileData.hobbies.includes(hobby.value)} className="accent-rose-500" />
                      <span>{hobby.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Settings */}
              <button
                type="submit"
                disabled={isUpdatingSettings}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md mt-6 flex items-center justify-center gap-2"
              >
                {isUpdatingSettings ? (
                  <span>Saving Orbits ... 🪐</span>
                ) : (
                  <span>Save Profile Orbits 🚀</span>
                )}
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
