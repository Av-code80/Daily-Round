import { Suspense } from 'react'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { listStops } from '@/features/tournee/data'
import { ReorderStops } from '@/features/tournee/components/tourneeDetail/ReorderStops'

type Props = { params: Promise<{ locale: string; id: string }> }

export default async function ReorderPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  return (
    <main className='mx-auto w-full max-w-2xl space-y-4 p-4'>
      <Suspense
        fallback={<div className='h-32 animate-pulse rounded-xl bg-foreground/5' />}
      >
        <ReorderLoader tourneeId={id} />
      </Suspense>
    </main>
  )
}

async function ReorderLoader({ tourneeId }: { tourneeId: string }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const [stops, t] = await Promise.all([
    listStops(session.user.id, tourneeId),
    getTranslations('Tournee.stops.reorderMode'),
  ])

  return (
    <>
      <h1 className='text-2xl font-bold tracking-tight text-[#1B2838] dark:text-foreground'>
        {t('title')}
      </h1>
      <p className='text-sm text-foreground/60'>{t('help')}</p>
      <ReorderStops
        tourneeId={tourneeId}
        initialStops={stops.map((s) => ({ id: s.id, address: s.address }))}
      />
    </>
  )
}
