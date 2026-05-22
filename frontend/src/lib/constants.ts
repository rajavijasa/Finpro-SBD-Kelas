import { ColorStyle } from "./types";

export const PORTRAITS = [
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

export const FACULTY_MAP: Record<string, 'Computing' | 'Engineering' | 'Business' | 'Art & Design'> = {
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

export const COURSES_BY_FACULTY: Record<string, { code: string; name: string }[]> = {
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

export const COLORS: ColorStyle[] = [
  { text: "text-rose-600", bg: "bg-rose-50 border-rose-100", dot: "bg-rose-500" },
  { text: "text-blue-600", bg: "bg-blue-50 border-blue-100", dot: "bg-blue-500" },
  { text: "text-fuchsia-600", bg: "bg-fuchsia-50 border-fuchsia-100", dot: "bg-fuchsia-500" },
  { text: "text-amber-600", bg: "bg-amber-50 border-amber-100", dot: "bg-amber-500" },
  { text: "text-teal-600", bg: "bg-teal-50 border-teal-100", dot: "bg-teal-500" },
  { text: "text-violet-600", bg: "bg-violet-50 border-violet-100", dot: "bg-violet-500" }
];

export const USER_PROFILES: Record<string, { bio: string; colorStyle: ColorStyle; gender: 'female' | 'male'; major: string; faculty: string }> = {
  Alice: {
    bio: "Tech enthusiast, casual gamer, and pizza lover. Looking to find classmates to co-work, game, or play basketball with! 💻🎮🏀",
    colorStyle: COLORS[0],
    gender: 'female',
    major: "Information Systems",
    faculty: "Computing"
  },
  Bob: {
    bio: "Business major, startup dreamer, and epic gamer. Let's discuss business plans or carry matches in our favorite games. 📈🕹️",
    colorStyle: COLORS[1],
    gender: 'male',
    major: "Business Administration",
    faculty: "Business"
  },
  Carol: {
    bio: "Always outdoors, massive football fan, and coffee addict. Down for weekend sports or catching up on coursework. ⚽☕✨",
    colorStyle: COLORS[2],
    gender: 'female',
    major: "Information Systems",
    faculty: "Computing"
  },
  Dave: {
    bio: "Mechanical builder by day, sports player by night. Fascinated by 3D printing and competitive basketball. 🛠️🏀",
    colorStyle: COLORS[3],
    gender: 'male',
    major: "Mechanical Engineering",
    faculty: "Engineering"
  },
  Erin: {
    bio: "Freshman eager to explore campus! Passionate about gaming, running, and all things engineering. Let's connect! 🚀🎮🏃‍♀️",
    colorStyle: COLORS[4],
    gender: 'female',
    major: "Mechanical Engineering",
    faculty: "Engineering"
  },
  Frank: {
    bio: "Senior cruising through the final semester. Avid gaming fan and finance nerd. Down for multiplayer sessions or coffee talks. ☕🎮",
    colorStyle: COLORS[5],
    gender: 'male',
    major: "Business Administration",
    faculty: "Business"
  }
};
