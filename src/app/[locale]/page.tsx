import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function Homepage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('Common')

  return (
    <main className='flex min-h-svh flex-col items-center justify-center'>
      <h1 className='text-4xl font-bold'>DailyRound</h1>
      <p className='mt-2 text-foreground/60'>{t('loading')}</p>
    </main>
  )
}
