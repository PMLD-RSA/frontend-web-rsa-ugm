'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Hexagon, Eye, EyeOff, Droplets, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Komponen inner yang menggunakan useSearchParams.
 * Dipisah agar bisa dibungkus <Suspense> — Next.js App Router requirement.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearError();
    const success = await login(username, password);
    if (success) {
      // Redirect ke halaman yang dituju sebelum login, fallback ke dashboard
      const from = searchParams.get('from') || '/';
      router.push(from);
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Card Container */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header Card */}
        <div className="bg-gradient-to-r from-[#0a354c] to-[#0d4a6e] px-8 py-10 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
              <Hexagon className="w-9 h-9 text-yellow-400 fill-yellow-400/20" />
            </div>
          </div>

          <h1 className="text-white font-bold text-2xl tracking-tight">RSA UGM</h1>
          <p className="text-blue-200 text-sm font-semibold mt-1">SI-POTA v1.0</p>
          <p className="text-blue-200/70 text-xs mt-2 leading-relaxed">
            Sistem Informasi Pemantauan Tangki Air<br />
            Rumah Sakit Akademik Universitas Gadjah Mada
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-8">
          <h2 className="text-slate-800 font-bold text-lg mb-6 text-center">Masuk ke Sistem</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all bg-slate-50"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#0a354c] hover:bg-[#0d4a6e] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                'Masuk ke Sistem'
              )}
            </button>
          </form>

          {/* Dev hint */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700 font-semibold mb-1">
                🔧 Mode Pengembangan (Dev Credentials)
              </p>
              <p className="text-xs text-amber-600">
                admin / admin123 &nbsp;|&nbsp; operator / op123 &nbsp;|&nbsp; viewer / view123
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 flex items-center justify-center gap-2 text-blue-200/60 text-xs">
        <Droplets className="w-3.5 h-3.5" />
        <span>Sistem Monitoring Air RSA UGM &copy; 2024</span>
      </div>
    </div>
  );
}

/**
 * LoginPage — wrapper dengan Suspense agar useSearchParams() aman di static generation.
 * Next.js App Router mensyaratkan komponen yang menggunakan useSearchParams
 * untuk dibungkus dalam Suspense boundary.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
