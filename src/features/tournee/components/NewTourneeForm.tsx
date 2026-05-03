'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Loader2, Mic, Bike, Car, Truck, Bus } from 'lucide-react'

import {
  tourneeFormSchema,
  VEHICLE_TYPES,
  type TourneeFormValues,
  type VehicleType,
} from '../schemas'
import { createTournee } from '../actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { todayLocalIso } from '../utils/date'

const VEHICLE_ICONS = {
  bike: Bike,
  scooter: Bike,
  car: Car,
  van: Bus,
  truck: Truck,
} satisfies Record<VehicleType, typeof Bike>


export function NewTourneeForm() {
  const t = useTranslations('Tournee')
  const router = useRouter()

  const form = useForm<TourneeFormValues>({
    resolver: zodResolver(tourneeFormSchema),
    defaultValues: {
      date: todayLocalIso(),
      vehicle_type: 'van',
      parcel_count: '',
      notes: '',
    },
  })
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form
  const vehicle = watch('vehicle_type')

  const mutation = useMutation({
    mutationFn: createTournee,
    onSuccess: (result) => {
      if (result.ok) router.push(`/tournees/${result.id}`)
    },
  })
  
  const serverError =
    mutation.data && !mutation.data.ok ? mutation.data.error : null

  const inputClass =
    'h-12 text-base border-[#1B2838]/20 focus-visible:border-[#FF6B35] focus-visible:ring-2 focus-visible:ring-[#FF6B35]/25'

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      aria-busy={mutation.isPending}
      noValidate
      className='mx-auto max-w-lg space-y-5 rounded-xl border border-[#1B2838]/10 bg-white/80 p-6 shadow-xl shadow-[#1B2838]/10 backdrop-blur-sm dark:bg-background/80'
    >
      {/* Voice entry — wired in Phase 2 */}
      <button
        type='button'
        disabled
        className='flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-foreground/20 text-sm text-foreground/40'
      >
        <Mic className='h-4 w-4' aria-hidden />
        {t('new.voiceComingSoon')}
      </button>

      <fieldset
        disabled={mutation.isPending}
        className='space-y-4 border-0 p-0 disabled:opacity-50'
      >
        {/* Date */}
        <div className='space-y-1.5'>
          <Label htmlFor='date' className='text-sm font-medium'>
            {t('new.date')}
          </Label>
          <Input
            id='date'
            type='date'
            {...register('date')}
            className={inputClass}
          />
          {errors.date && (
            <p className='text-xs text-destructive'>{errors.date.message}</p>
          )}
        </div>

        {/* Vehicle pills */}
        <div className='space-y-1.5'>
          <Label className='text-sm font-medium'>{t('new.vehicle')}</Label>
          <div
            role='radiogroup'
            aria-label={t('new.vehicle')}
            className='grid grid-cols-5 gap-1.5'
          >
            {VEHICLE_TYPES.map((v) => {
              const Icon = VEHICLE_ICONS[v]
              const active = vehicle === v
              return (
                <button
                  key={v}
                  type='button'
                  role='radio'
                  aria-checked={active}
                  onClick={() =>
                    setValue('vehicle_type', v, { shouldDirty: true })
                  }
                  className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-lg border text-xs font-medium transition-colors ${
                    active
                      ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]'
                      : 'border-foreground/15 bg-background text-foreground/70 hover:bg-foreground/5'
                  }`}
                >
                  <Icon className='h-4 w-4' aria-hidden />
                  {t(`vehicle.${v}`)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Parcel count */}
        <div className='space-y-1.5'>
          <Label htmlFor='parcel_count' className='text-sm font-medium'>
            {t('new.parcelCount')}
          </Label>
          <Input
            id='parcel_count'
            inputMode='numeric'
            placeholder='100'
            {...register('parcel_count')}
            className={inputClass}
          />
          {errors.parcel_count && (
            <p className='text-xs text-destructive'>
              {errors.parcel_count.message}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className='space-y-1.5'>
          <Label htmlFor='notes' className='text-sm font-medium'>
            {t('new.notes')}
          </Label>
          <textarea
            id='notes'
            rows={3}
            {...register('notes')}
            className='w-full rounded-md border border-[#1B2838]/20 bg-background p-3 text-base focus-visible:border-[#FF6B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]/25'
          />
          {errors.notes && (
            <p className='text-xs text-destructive'>{errors.notes.message}</p>
          )}
        </div>
      </fieldset>

      {serverError && (
        <p role='alert' className='text-sm text-destructive'>
          {t(`new.errors.${serverError}`)}
        </p>
      )}

      <Button
        type='submit'
        disabled={mutation.isPending}
        className='h-12 w-full bg-[#FF6B35] text-base font-semibold text-white hover:bg-[#FF6B35]/90 disabled:opacity-60'
      >
        {mutation.isPending ? (
          <>
            <Loader2 className='mr-2 h-5 w-5 animate-spin' aria-hidden />
            {t('new.submitting')}
          </>
        ) : (
          t('new.submit')
        )}
      </Button>
    </form>
  )
}
