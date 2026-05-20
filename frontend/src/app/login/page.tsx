import { loginAction } from '../actions/auth';
import Link from 'next/link';

export default async function LoginPage() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-rose-950 to-slate-950 px-6 py-12 relative overflow-hidden selection:bg-rose-500 selection:text-white">
      
      {/* Decorative Blur Sparks */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Glassmorphic Login Container */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative z-10 flex flex-col items-center">
        
        {/* Branding Logo Header */}
        <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-600 shadow-lg shadow-rose-500/20 text-white font-black text-2xl mb-4 hover:scale-105 transition-transform">
          C
        </div>
        
        <h1 className="text-2xl font-black tracking-tight text-white mt-1 text-center flex items-baseline gap-1">
          CampusCircle <span className="text-xs font-bold text-rose-500 tracking-widest uppercase bg-rose-500/10 px-2 py-0.5 rounded">Match</span>
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-1.5 text-center leading-relaxed">
          Sign in to access your student profile & campus social orbits
        </p>

        {/* Credentials Form */}
        <form action={loginAction} className="w-full mt-8 space-y-4">
          
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Username</label>
            <input 
              type="text" 
              name="username" 
              placeholder="e.g. sarah_pratama" 
              required
              className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
            <input 
              type="password" 
              name="password" 
              placeholder="••••••••" 
              required
              className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-6 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 active:scale-[0.98] transition-all text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-rose-500/20"
          >
            Sign In 🚀
          </button>
        </form>

        {/* Registration CTA Link */}
        <div className="mt-6 text-center text-xs text-slate-500 font-semibold">
          Don't have a profile?{' '}
          <Link href="/register" className="text-rose-500 hover:underline font-bold">
            Create Account
          </Link>
        </div>

        {/* Quick Demo Hint */}
        <div className="mt-6 border border-dashed border-slate-800 rounded-2xl p-3 bg-slate-950/20 w-full text-center">
          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500">Supabase SQL Seed Accounts 💡</span>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-medium">
            Register a new account to test database insertion, or try the Supabase password <code className="text-slate-200 bg-slate-800 px-1 py-0.5 rounded">QI5aeY3s0B6JyR3p</code> in backend logs.
          </p>
        </div>

      </div>
    </div>
  );
}
