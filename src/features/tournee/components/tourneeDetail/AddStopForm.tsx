'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import type { z } from 'zod'
import { stopFormSchema, type StopFormValues } from '../../schemas'
import { addStop } from '../../actions'

type StopFormInput = z.input<typeof stopFormSchema>

const KNOWN_ERRORS = [
  'invalid_input',
  'invalid_id',
  'not_authenticated',
  'not_found',
  'db_error',
] as const
type KnownError = (typeof KNOWN_ERRORS)[number]

type Props = { tourneeId: string }

export function AddStopForm({ tourneeId }: Props) {
  const t = useTranslations('Tournee.stops.add')
  const tPriority = useTranslations('Tournee.stops.priority')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<KnownError | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StopFormInput, unknown, StopFormValues>({
    resolver: zodResolver(stopFormSchema),
    defaultValues: {
      address: '',
      time_window_start: '',
      time_window_end: '',
      priority: 2,
      weight_kg: '',
      notes: '',
    },
  })

  const notesValue = watch('notes') ?? ''

  function onSubmit(values: StopFormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await addStop(tourneeId, values)
      if (!result.ok) {
        setServerError(
          (KNOWN_ERRORS as readonly string[]).includes(result.error)
            ? (result.error as KnownError)
            : 'db_error',
        )
        return
      }
      router.push(`/tournees/${tourneeId}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
      <div className='space-y-1.5'>
        <label htmlFor='address' className='text-sm font-medium'>
          {t('address')} *
        </label>
        <input
          id='address'
          type='text'
          autoComplete='street-address'
          className='h-14 w-full rounded-xl border border-foreground/15 bg-background px-4 text-base focus:border-[#FF6B35] focus:outline-none'
          {...register('address')}
        />
        <p className='text-xs text-foreground/60'>{t('addressHelp')}</p>
        {errors.address && (
          <p className='text-xs text-red-600'>{errors.address.message}</p>
        )}
      </div>

      <fieldset className='space-y-1.5'>
        <legend className='text-sm font-medium'>{t('timeWindow')}</legend>
        <div className='flex gap-3'>
          <div className='flex-1 space-y-1'>
            <input
              type='time'
              aria-label={t('start')}
              className='h-14 w-full rounded-xl border border-foreground/15 bg-background px-4 font-mono text-base focus:border-[#FF6B35] focus:outline-none'
              {...register('time_window_start')}
            />
            <p className='text-xs text-foreground/60'>{t('start')}</p>
          </div>
          <div className='flex-1 space-y-1'>
            <input
              type='time'
              aria-label={t('end')}
              className='h-14 w-full rounded-xl border border-foreground/15 bg-background px-4 font-mono text-base focus:border-[#FF6B35] focus:outline-none'
              {...register('time_window_end')}
            />
            <p className='text-xs text-foreground/60'>{t('end')}</p>
          </div>
        </div>
        {errors.time_window_end && (
          <p className='text-xs text-red-600'>
            {errors.time_window_end.message}
          </p>
        )}
      </fieldset>

      <div className='space-y-1.5'>
        <label className='text-sm font-medium'>{t('priority')}</label>
        <div className='grid grid-cols-3 gap-2'>
          {[1, 2, 3].map((value) => (
            <label
              key={value}
              className='flex h-14 cursor-pointer items-center justify-center rounded-xl border border-foreground/15 bg-background text-sm font-medium has-[:checked]:border-[#FF6B35] has-[:checked]:bg-[#FF6B35]/10 has-[:checked]:text-[#FF6B35]'
            >
              <input
                type='radio'
                value={value}
                {...register('priority', { valueAsNumber: true })}
                className='sr-only'
              />
              {tPriority(String(value))}
            </label>
          ))}
        </div>
      </div>

      <div className='space-y-1.5'>
        <label htmlFor='weight' className='text-sm font-medium'>
          {t('weight')}
        </label>
        <input
          id='weight'
          type='text'
          inputMode='decimal'
          className='h-14 w-32 rounded-xl border border-foreground/15 bg-background px-4 font-mono text-base focus:border-[#FF6B35] focus:outline-none'
          {...register('weight_kg')}
        />
        {errors.weight_kg && (
          <p className='text-xs text-red-600'>{errors.weight_kg.message}</p>
        )}
      </div>

      <div className='space-y-1.5'>
        <label htmlFor='notes' className='text-sm font-medium'>
          {t('notes')}
        </label>
        <textarea
          id='notes'
          rows={3}
          maxLength={500}
          className='w-full rounded-xl border border-foreground/15 bg-background p-4 text-base focus:border-[#FF6B35] focus:outline-none'
          {...register('notes')}
        />
        <p className='text-right text-xs text-foreground/60'>
          {t('notesCounter', { count: notesValue.length })}
        </p>
        {errors.notes && (
          <p className='text-xs text-red-600'>{errors.notes.message}</p>
        )}
      </div>

      <button
        type='submit'
        disabled={pending}
        className='h-16 w-full rounded-xl bg-[#FF6B35] font-semibold text-white shadow-lg active:bg-[#e5602e] disabled:opacity-50'
      >
        {pending ? t('submitting') : t('submit')}
      </button>

      {serverError && (
        <p className='text-center text-sm text-red-600'>
          {t(`errors.${serverError}`)}
        </p>
      )}

      <div className='flex justify-around border-t border-foreground/10 pt-4 text-xs text-foreground/50'>
        <span aria-disabled>{t('voiceComingSoon')}</span>
        <span aria-disabled>{t('scanComingSoon')}</span>
      </div>
    </form>
  )
}
