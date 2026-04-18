import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export default async function IncidentsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Navigation')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t('incidents')}</h1>
      <p className="text-foreground/60 mt-2">Coming soon</p>
    </div>
  )
}
