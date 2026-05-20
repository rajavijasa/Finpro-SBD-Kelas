'use client';

import { useState } from 'react';
import { registerAction } from '../actions/auth';
import Link from 'next/link';

// Synthesized Universities from the campus database
const UNIVERSITIES = [
  "Campus Circle University",
  "Global Technology Institute",
  "Metropolitan Business School"
];

// Synthesized Majors mapped to their Faculty departments
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

// Course offerings mapped by Faculty department
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

export default function RegisterPage() {
  const [selectedMajor, setSelectedMajor] = useState<string>('Information Systems');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const currentFaculty = FACULTY_MAP[selectedMajor] ?? 'Computing';
  const availableCourses = COURSES_BY_FACULTY[currentFaculty];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await registerAction(formData);
    setLoading(false);
    if (res && res.error) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-rose-950 to-slate-950 px-6 py-12 relative overflow-hidden selection:bg-rose-500 selection:text-white">
      
      {/* Decorative Blur Sparks */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Glassmorphic Register Container */}
      <div className="w-full max-w-xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative z-10 flex flex-col items-center">
        
        {/* Branding Logo Header */}
        <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-600 shadow-lg shadow-rose-500/20 text-white font-black text-xl mb-3 hover:scale-105 transition-transform">
          C
        </div>
        
        <h1 className="text-xl font-black tracking-tight text-white text-center flex items-baseline gap-1">
          Create Spark Profile <span className="text-[9px] font-bold text-rose-500 tracking-widest uppercase bg-rose-500/10 px-1.5 py-0.5 rounded">Supabase SQL</span>
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-1 text-center">
          Register to instantly seed your profile to PostgreSQL and sync your orbits to Neo4j
        </p>

        {error && (
          <div className="w-full bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs px-4 py-2.5 rounded-xl font-semibold mt-4 text-center">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="w-full mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          
          {/* Section 1: Credentials */}
          <div className="md:col-span-2 border-b border-slate-800 pb-2 mb-2">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Account Authentication</span>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Full Name *</label>
            <input 
              type="text" 
              name="fullName" 
              placeholder="e.g. Sarah Pratama" 
              required
              className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Username *</label>
            <input 
              type="text" 
              name="username" 
              placeholder="e.g. sarah_pratama" 
              required
              className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Password *</label>
            <input 
              type="password" 
              name="password" 
              placeholder="••••••••" 
              required
              className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Phone Number</label>
            <input 
              type="text" 
              name="phone" 
              placeholder="e.g. +628123456789" 
              className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none transition-all"
            />
          </div>

          {/* Section 2: Campus Details */}
          <div className="md:col-span-2 border-b border-slate-800 pb-2 mt-2 mb-2">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Campus & Academic Orbits</span>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">University</label>
            <select 
              name="university"
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              {UNIVERSITIES.map(uni => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Major *</label>
            <select 
              name="major"
              required
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              {Object.keys(FACULTY_MAP).map(maj => (
                <option key={maj} value={maj}>{maj}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Academic Year</label>
            <select 
              name="year"
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="1">Year 1 (Freshman)</option>
              <option value="2">Year 2 (Sophomore)</option>
              <option value="3">Year 3 (Junior)</option>
              <option value="4">Year 4 (Senior)</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Gender</label>
            <select 
              name="gender"
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>

          {/* Section 3: Orbits & Nodes Relationships */}
          <div className="md:col-span-2 border-b border-slate-800 pb-2 mt-2 mb-2">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Orbits Relationships (Neo4j Match Graph)</span>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Select Enrolled Courses * ({currentFaculty} Faculty)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableCourses.map((course, idx) => (
                <label key={course.code} className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300 cursor-pointer hover:border-rose-500/50 transition-colors">
                  <input type="checkbox" name="courses" value={course.code} defaultChecked={idx < 2} className="accent-rose-500" />
                  <span>{course.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Your Hobbies * (Select at least 1)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { value: 'Chess', label: 'Chess ♟️', checked: true },
                { value: 'Coding', label: 'Coding 💻', checked: true },
                { value: 'Cooking', label: 'Cooking 🍳', checked: false },
                { value: 'Football', label: 'Football ⚽', checked: false },
                { value: 'Photography', label: 'Photography 📷', checked: false },
                { value: 'Basketball', label: 'Basketball 🏀', checked: false },
                { value: 'Hiking', label: 'Hiking 🥾', checked: false },
                { value: 'Music Production', label: 'Music Prod 🎵', checked: false },
                { value: 'Yoga', label: 'Yoga 🧘', checked: false },
              ].map((hobby) => (
                <label key={hobby.value} className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-2.5 py-2 rounded-xl text-[11px] text-slate-300 cursor-pointer hover:border-rose-500/50 transition-colors">
                  <input type="checkbox" name="hobbies" value={hobby.value} defaultChecked={hobby.checked} className="accent-rose-500" />
                  <span>{hobby.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Short Bio Prompt</label>
            <textarea 
              name="bio"
              rows={2}
              placeholder="e.g. Passionate about AI research, late-night gaming, and campus coffee runs! ☕🎮"
              className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 active:scale-[0.98] transition-all text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-rose-500/20 flex items-center justify-center"
            >
              {loading ? "Launching Spark Core... 🚀" : "Register & Launch Spark Core 🚀"}
            </button>
          </div>

        </form>

        {/* Login CTA Link */}
        <div className="mt-5 text-center text-xs text-slate-500 font-semibold">
          Already have an account?{' '}
          <Link href="/login" className="text-rose-500 hover:underline font-bold">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
