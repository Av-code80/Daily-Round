import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function AuthErrorPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Auth')

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-[#1B2838] to-slate-950 px-4">

      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-black/40 text-center">

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl">
              ⚠️
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">
            {t('errorTitle')}
          </h1>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            {t('errorSubtitle')}
          </p>

          <Link
            href="/auth/login"
            className="flex items-center justify-center w-full h-14 rounded-xl bg-gradient-to-r from-[#FF6B35] to-orange-400 hover:from-orange-400 hover:to-[#FF6B35] text-white font-semibold text-base shadow-lg shadow-orange-500/25 transition-all duration-300"
          >
            {t('backToLogin')}
          </Link>
        </div>

        <div className="absolute inset-x-8 -bottom-px h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
      </div>
    </div>
  )
}