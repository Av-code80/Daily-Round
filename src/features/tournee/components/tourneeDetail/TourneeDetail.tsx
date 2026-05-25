import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTournee } from '../../data'
import { TourneeStatusSwitcher } from '../TourneeStatusSwitcher'
import { TourneeDeleteButton } from './TourneeDeleteButton'
import { type VehicleType, vehicleTypeSchema } from '../../schemas'

import { Bike, Bus, Car, ChevronLeft, Truck } from 'lucide-react'
import { TourneeStops } from './TourneeStops'

const VEHICLE_ICONS = {
  bike: Bike,
  scooter: Bike,
  car: Car,
  van: Bus,
  truck: Truck,
} satisfies Record<VehicleType, typeof Bike>
export async function TourneeDetail({ tourneeId }: { tourneeId: string }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/auth/login')

  const tournee = await getTournee(userId, tourneeId)
  const t = await getTranslations('Tournee')

  if (!tournee) {
    return (
      <div className='py-12 text-center'>
        <p className='text-foreground/60'>{t('detail.notFound')}</p>
        <Link
          href='/'
          className='mt-4 inline-block text-sm text-[#FF6B35] hover:underline'
        >
          ← {t('title')}
        </Link>
      </div>
    )
  }

  const vehicleType = vehicleTypeSchema.catch('van').parse(tournee.vehicle_type)
  const VehicleIcon = VEHICLE_ICONS[vehicleType]

  return (
    <>
      <header className='space-y-3 pt-2'>
        <Link
          href='/'
          className='inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground'
        >
          <ChevronLeft className='h-4 w-4' aria-hidden />
          {t('title')}
        </Link>
        <div className='flex items-start gap-3'>
          <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35]/10'>
            <VehicleIcon className='h-7 w-7 text-[#FF6B35]' aria-hidden />
          </div>
          <div className='min-w-0 flex-1'>
            <h1 className='text-2xl font-bold tracking-tight text-[#1B2838] dark:text-foreground'>
              {t(`vehicle.${vehicleType}`)}
            </h1>
            <p className='text-sm text-foreground/60'>
              {tournee.date}
              <span className='mx-1.5'>·</span>
              {t('parcels', { count: tournee.parcel_count ?? 0 })}
            </p>
          </div>
        </div>
      </header>

      <section className='space-y-2'>
        <h2 className='text-sm font-semibold text-foreground/80'>
          {t('detail.statusLabel')}
        </h2>
        <TourneeStatusSwitcher
          tourneeId={tournee.id}
          initialStatus={tournee.status}
        />
      </section>

      {tournee.notes && (
        <section className='space-y-2'>
          <h2 className='text-sm font-semibold text-foreground/80'>
            {t('new.notes')}
          </h2>
          <p className='whitespace-pre-wrap rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-sm'>
            {tournee.notes}
          </p>
        </section>
      )}
      <TourneeStops tournee={tournee} userId={userId} />

      <section className='border-t border-foreground/10 pt-4'>
        <TourneeDeleteButton tourneeId={tournee.id} />
      </section>
    </>
  )
}
