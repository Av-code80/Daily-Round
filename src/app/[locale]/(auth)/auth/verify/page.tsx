import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export default async function VerifyPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Auth')

  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-3xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-4xl">
          📬
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-3">
        {t('verifyTitle')}
      </h1>
      <p className="text-white/50 text-sm leading-relaxed mb-6">
        {t('verifySubtitle')}
      </p>

      <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3">
        <p className="text-white/40 text-xs">{t('verifySpam')}</p>
      </div>
    </div>
  )
}
