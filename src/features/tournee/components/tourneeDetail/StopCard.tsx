import { getTranslations } from 'next-intl/server'
import type { StopListItem } from '../../data'
import { StopCardActions } from './StopCardActions'

type Props = {
  stop: StopListItem
  position: number // 1-based, computed by parent
}

export async function StopCard({ stop, position }: Props) {
  const t = await getTranslations('Tournee.stops')
  const isCompleted = stop.status === 'completed'
  const hasTimeWindow = !!stop.time_window_start && !!stop.time_window_end

  return (
    <article
      className={`rounded-xl border border-foreground/10 bg-background p-4 ${
        isCompleted ? 'opacity-60' : ''
      }`}
    >
      <div className='flex items-start gap-3'>
        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 font-mono text-sm font-bold'>
          {position}
        </div>
        <div className='min-w-0 flex-1 space-y-1.5'>
          <p className={`font-medium ${isCompleted ? 'line-through' : ''}`}>
            {stop.address}
          </p>
          <p className='flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-foreground/60'>
            {hasTimeWindow ? (
              <span>
                ⏱ {stop.time_window_start?.slice(0, 5)}–
                {stop.time_window_end?.slice(0, 5)}
              </span>
            ) : (
              <span>⏱ {t('timeWindow.flexible')}</span>
            )}
            {stop.weight_kg !== null && <span>⚖ {stop.weight_kg} kg</span>}
            {stop.priority === 3 && <span>★ {t('priority.3')}</span>}
          </p>
          {isCompleted && stop.completed_at && (
            <p className='text-xs text-green-600'>
              ✓ {t('delivered')} ·
              <span className='font-mono'>
                {new Date(stop.completed_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          )}
          {stop.notes && (
            <p className='text-xs text-foreground/70'>{stop.notes}</p>
          )}
        </div>
      </div>
      <StopCardActions stopId={stop.id} isCompleted={isCompleted} />
    </article>
  )
}
