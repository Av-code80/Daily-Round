import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LoginForm } from '@/features/auth/components/LoginForm'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Auth')

  return (
    <div className='relative min-h-screen flex items-center justify-center overflow-hidden bg-linear-to-br from-slate-950 via-[#1B2838] to-slate-950 px-4'>
      {/* Decorative gradient blobs */}
      <div className='absolute -top-40 -left-40 w-96 h-96 bg-[#FF6B35]/15 rounded-full blur-3xl pointer-events-none' />
      <div className='absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none' />

      {/* Glass card */}
      <div className='relative w-full max-w-md'>
        <div className='bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-black/40'>
          {/* Logo */}
          <div className='flex flex-col items-center mb-8'>
            <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-orange-400 flex items-center justify-center text-3xl shadow-lg shadow-orange-500/30 mb-4'>
              🚚
            </div>
            <span className='text-2xl font-bold bg-gradient-to-r from-[#FF6B35] to-orange-300 bg-clip-text text-transparent'>
              DailyRound
            </span>
          </div>

          {/* Heading */}
          <div className='mb-8 text-center'>
            <h1 className='text-xl font-semibold text-white mb-2'>
              {t('welcomeBack')} 👋
            </h1>
            <p className='text-white/50 text-sm leading-relaxed'>
              {t('loginSubtitle')}
            </p>
          </div>

          {/* Form */}
          <LoginForm />
        </div>

        {/* Bottom glow line */}
        <div className='absolute inset-x-8 -bottom-px h-px bg-gradient-to-r from-transparent via-[#FF6B35]/50 to-transparent' />
      </div>
    </div>
  )
}
