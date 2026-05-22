'use client';

import { useState } from 'react';
import { FACULTY_MAP, COURSES_BY_FACULTY } from "@/lib/constants";
import { StudentProfile } from "@/lib/types";

interface SettingsModalProps {
  profileData: StudentProfile;
  isUpdating: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
}

export function SettingsModal({
  profileData,
  isUpdating,
  onClose,
  onSave
}: SettingsModalProps) {
  const [settingsMajor, setSettingsMajor] = useState<string>(profileData.major || 'Information Systems');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md px-6 py-12 overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-slate-200 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500 text-white font-bold text-xs shadow-sm">⚙️</span>
            <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Configure Your Orbits</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-650 font-extrabold text-xs bg-slate-100 px-2.5 py-1 rounded-lg"
          >
            Close ✕
          </button>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            onSave(new FormData(e.currentTarget));
          }} 
          className="space-y-4 text-left"
        >
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
                {[1, 2, 3, 4].map(y => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
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

          <div className="border-t border-slate-100 pt-3">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Select Enrolled Courses ({FACULTY_MAP[settingsMajor] || 'Computing'} Faculty Relations)
            </label>
            <div key={settingsMajor} className="grid grid-cols-2 gap-2">
              {(COURSES_BY_FACULTY[FACULTY_MAP[settingsMajor] || 'Computing'] || COURSES_BY_FACULTY.Computing).map((course) => (
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

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md mt-6 flex items-center justify-center gap-2"
          >
            {isUpdating ? <span>Saving Orbits ... 🪐</span> : <span>Save Profile Orbits 🚀</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
