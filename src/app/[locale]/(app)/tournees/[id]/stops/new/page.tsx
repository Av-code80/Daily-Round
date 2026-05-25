import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ChevronLeft } from 'lucide-react'
import { AddStopForm } from '@/features/tournee/components/tourneeDetail/AddStopForm';

type Props = { params: Promise<{ locale: string; id: string }> }

export default async function NewStopPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Tournee.stops.add')

  return (
    <main className='mx-auto w-full max-w-2xl space-y-4 p-4'>
      <Link
        href={`/tournees/${id}`}
        className='inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground'
      >
        <ChevronLeft className='h-4 w-4' aria-hidden />
        {t('title')}
      </Link>
      <h1 className='text-2xl font-bold tracking-tight text-[#1B2838] dark:text-foreground'>
        {t('title')}
      </h1>
      <AddStopForm tourneeId={id} />
    </main>
  )
}
