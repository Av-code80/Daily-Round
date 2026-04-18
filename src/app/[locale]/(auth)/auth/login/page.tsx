import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LoginForm } from '@/features/auth/components/LoginForm'

type Props = { params: Promise<{ locale: string }> }

export default async function LoginPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Auth')

  return (
    <>
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-orange-400 flex items-center justify-center text-3xl shadow-lg shadow-orange-500/30 mb-4">
          🚚
        </div>
        <span className="text-2xl font-bold bg-gradient-to-r from-[#FF6B35] to-orange-300 bg-clip-text text-transparent">
          DailyRound
        </span>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-xl font-semibold text-white mb-2">
          {t('welcomeBack')} 👋
        </h1>
        <p className="text-white/50 text-sm leading-relaxed">
          {t('loginSubtitle')}
        </p>
      </div>

      <LoginForm />
    </>
  )
}
