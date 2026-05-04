import { getTranslations } from 'next-intl/server'
import { Bike, Car, Truck, Bus, ChevronRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { TourneeListItem } from '../data'
import type { VehicleType } from '../schemas'

const VEHICLE_ICONS = {
  bike: Bike,
  scooter: Bike, // same icon, label distinguishes
  car: Car,
  van: Bus,
  truck: Truck,
} satisfies Record<VehicleType, typeof Bike>

const STATUS_BADGE = {
  pending: 'bg-foreground/10 text-foreground/70',
  in_progress: 'bg-[#FF6B35]/15 text-[#FF6B35]',
  completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
} satisfies Record<TourneeListItem['status'], string>
type Props = {
  tournee: TourneeListItem
  highlight?: boolean
}

export async function TourneeCard({ tournee, highlight = false }: Props) {
  const t = await getTranslations('Tournee')
  const VehicleIcon =
    VEHICLE_ICONS[tournee.vehicle_type as VehicleType] ?? Bus

  return (
    <Link
      href={`/tournees/${tournee.id}`}
      aria-label={`${tournee.name} — ${t(`status.${tournee.status}`)}`}
      className={`block rounded-xl border bg-background p-4 transition-colors hover:bg-foreground/5 ${
        highlight
          ? 'border-[#FF6B35]/40 shadow-md shadow-[#FF6B35]/10'
          : 'border-foreground/10'
      }`}
    >
      <div className='flex items-start gap-3'>
        <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-foreground/5'>
          <VehicleIcon className='h-6 w-6' aria-hidden />
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center justify-between gap-2'>
            <p className='truncate font-semibold text-[#1B2838] dark:text-foreground'>
              {t(`vehicle.${tournee.vehicle_type as VehicleType}`)}
            </p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[tournee.status]}`}
            >
              {t(`status.${tournee.status}`)}
            </span>
          </div>
          <p className='mt-1 text-sm text-foreground/60'>
            {t('parcels', { count: tournee.parcel_count ?? 0 })}
            <span className='mx-1.5'>·</span>
            {tournee.date}
          </p>
        </div>
        <ChevronRight
          className='mt-3 h-5 w-5 shrink-0 text-foreground/30'
          aria-hidden
        />
      </div>
    </Link>
  )
}
