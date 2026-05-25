import Link from 'next/link'
import { Suspense } from 'react'
import { StopList } from './StopList'
import { getTranslations } from 'next-intl/server'
import { TourneeListItem } from '../../data'

export async function TourneeStops({
  tournee,
  userId,
}: {
  tournee: TourneeListItem
  userId: string
}) {
  const t = await getTranslations('Tournee')

  return (
    <section className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h2 className='text-sm font-semibold tracking-wider text-foreground/60'>
          📍 {t('detail.stopsTitle')}
        </h2>
        <Link
          href={`/tournees/${tournee.id}/reorder`}
          className='text-xs font-medium text-foreground/70 hover:text-foreground'
        >
          {t('stops.reorder')}
        </Link>
      </div>
      <Suspense
        fallback={
          <div className='space-y-2'>
            <div className='h-20 animate-pulse rounded-xl bg-foreground/5' />
            <div className='h-20 animate-pulse rounded-xl bg-foreground/5' />
          </div>
        }
      >
        <StopList userId={userId} tourneeId={tournee.id} />
      </Suspense>

      <div className='sticky bottom-4 z-10 pt-2'>
        <Link
          href={`/tournees/${tournee.id}/stops/new`}
          className='block w-full rounded-xl bg-[#f5774a] py-3 text-center font-semibold text-white shadow-lg active:bg-[#e5602e]'
        >
          {t('stops.addCta')}
        </Link>
      </div>
    </section>
  )
}
