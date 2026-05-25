import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { listStops } from '../../data'
import { StopCard } from './StopCard'

type Props = {
  userId: string
  tourneeId: string
}

export async function StopList({ userId, tourneeId }: Props) {
  const stops = await listStops(userId, tourneeId)
  const t = await getTranslations('Tournee.stops')

  if (stops.length === 0) {
    return (
      <div className='rounded-2xl border border-dashed border-foreground/15 p-6 text-center'>
        <div className='mx-auto mb-3 text-3xl' aria-hidden>
          📦
        </div>
        <p className='font-semibold'>{t('empty.title')}</p>
        <p className='mx-auto mt-1 max-w-xs text-sm text-foreground/60'>
          {t('empty.message')}
        </p>
        <Link
          href={`/tournees/${tourneeId}/stops/new`}
          className='mt-4 inline-flex h-12 items-center justify-center rounded-xl bg-[#f5774a] px-6 font-semibold text-white active:bg-[#e5602e]'
        >
          {t('empty.cta')}
        </Link>
        <p className='mt-3 text-xs text-foreground/50'>
          {t('empty.comingSoon')}
        </p>
      </div>
    )
  }

  return (
    <ol className='space-y-2'>
      {stops.map((stop, i) => (
        <li key={stop.id}>
          <StopCard stop={stop} position={i + 1} />
        </li>
      ))}
    </ol>
  )
}
