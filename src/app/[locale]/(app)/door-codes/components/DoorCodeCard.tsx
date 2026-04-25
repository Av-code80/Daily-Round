import { Building2, CarFront, MapPin } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { DoorCodeListItem } from '@/features/door-codes/data'

export async function DoorCodeCard({ code }: { code: DoorCodeListItem }) {
  const t = await getTranslations('DoorCodes.card')
  return (
    <article className='group rounded-2xl border border-[#1B2838]/20 bg-card p-5 shadow-amber-50 shadow-lg transition-all hover:-translate-y-0.5 hover:border-[#FF6B35]/30 hover:shadow-md'>
      <header className='flex items-start gap-2.5'>
        <div className='mt-0.5 rounded-lg bg-[#FF6B35]/10 p-1.5'>
          <MapPin className='h-3.5 w-3.5 text-[#FF6B35]' aria-hidden />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-semibold text-[#1B2838] dark:text-foreground'>
            {code.address}
          </p>
          <p className='text-xs text-[#1B2838]/60 dark:text-foreground/60'>
            {code.city}
            {code.postal_code && ` · ${code.postal_code}`}
          </p>
        </div>
      </header>
      <div className='relative my-4 overflow-hidden rounded-xl bg-linear-to-br from-[#df5a2a]/12 via-[#903b1c]/6 to-transparent p-5 ring-1 ring-inset ring-[#FF6B35]/10'>
        <p className='text-center font-mono text-3xl font-bold tracking-[0.25em] text-[#FF6B35]'>
          {code.code}
        </p>
      </div>
      <div className='space-y-1.5 text-sm'>
        {(code.floor || code.instructions) && (
          <div className='flex items-start gap-2 text-[#1B2838]/80 dark:text-foreground/80'>
            <Building2
              className='mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1B2838]/50'
              aria-hidden
            />
            <p className='leading-snug'>
              {code.floor && (
                <span className='font-medium'>
                  {t('floor', { n: code.floor })}
                </span>
              )}
              {code.floor && code.instructions && (
                <span className='text-[#1B2838]/30'> · </span>
              )}
              {code.instructions}
            </p>
          </div>
        )}
        {code.parking_hint && (
          <div className='flex items-start gap-2 text-[#1B2838]/80 dark:text-foreground/80'>
            <CarFront
              className='mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1B2838]/50'
              aria-hidden
            />
            <p className='leading-snug'>{code.parking_hint}</p>
          </div>
        )}
      </div>
    </article>
  )
}
