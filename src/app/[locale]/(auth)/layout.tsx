import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-[#1B2838] to-slate-950 px-4">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FF6B35]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-black/40">
          {children}
        </div>
        <div className="absolute inset-x-8 -bottom-px h-px bg-gradient-to-r from-transparent via-[#FF6B35]/50 to-transparent" />
      </div>
    </div>
  )
}
