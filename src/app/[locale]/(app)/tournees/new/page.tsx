import { setRequestLocale, getTranslations } from 'next-intl/server'
import { ChevronLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { NewTourneeForm } from '@/features/tournee/components/NewTourneeForm'

type Props = { params: Promise<{ locale: string }> }

export default async function NewTourneePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Tournee')

  return (
    <main className='mx-auto w-full max-w-lg space-y-4 p-4'>
      <header className='space-y-2 pt-2'>
        <Link
          href='/'
          className='inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground'
        >
          <ChevronLeft className='h-4 w-4' aria-hidden />
          {t('title')}
        </Link>
        <h1 className='text-3xl font-bold tracking-tight text-[#1B2838] dark:text-foreground'>
          {t('new.title')}
        </h1>
        <p className='text-sm text-foreground/60'>{t('new.description')}</p>
      </header>
      <NewTourneeForm />
    </main>
  )
}
