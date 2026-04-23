'use client'

import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Loader2, SaveAll } from 'lucide-react'

import { type DoorCodeFormValues } from '../schemas'
import { createDoorCode } from '../actions'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useDoorCodeDraft } from '../hooks/use-door-code-draft'

export function DoorCodeForm() {
  const t = useTranslations('DoorCodes.form')
  const [success, setSuccess] = useState(false)

  const { form, onSuccess } = useDoorCodeDraft()
const { register, handleSubmit, formState: { errors } } = form

  const mutation = useMutation({
    mutationFn: createDoorCode,
    onSuccess: (result) => {
      if (result.ok) {        
        setSuccess(true)
        onSuccess()
      }
    },
  })  

  const onSubmit = (values: DoorCodeFormValues) => {
    setSuccess(false)
    mutation.mutate(values)    
  }

  const serverError =
    mutation.data && !mutation.data.ok ? mutation.data.error : null

  const inputClass =
    'h-12 text-base shadow-none border-[#1B2838]/20 focus-visible:border-[#FF6B35] focus-visible:ring-2 focus-visible:ring-[#FF6B35]/25'
  const monoInputClass = inputClass + ' font-mono tracking-wider'

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-busy={mutation.isPending}
      noValidate
      className='space-y-4'
    >
      <fieldset
        disabled={mutation.isPending}
        className='space-y-4 border-0 p-0 m-0 disabled:opacity-40 transition-opacity'
      >
        <Field
          id='address'
          label={t('address')}
          error={errors.address?.message}
          required
        >
          <Input
            id='address'
            {...register('address')}
            autoComplete='street-address'
            className={inputClass}
          />
        </Field>

        <div className='grid grid-cols-2 gap-3'>
          <Field
            id='city'
            label={t('city')}
            error={errors.city?.message}
            required
          >
            <Input
              id='city'
              {...register('city')}
              autoComplete='address-level2'
              className={inputClass}
            />
          </Field>
          <Field
            id='postal_code'
            label={t('postal_code')}
            error={errors.postal_code?.message}
          >
            <Input
              id='postal_code'
              inputMode='numeric'
              {...register('postal_code')}
              autoComplete='postal-code'
              className={inputClass}
            />
          </Field>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <Field
            id='arrondissement'
            label={t('arrondissement')}
            error={errors.arrondissement?.message}
          >
            <Input
              id='arrondissement'
              type='number'
              min={1}
              max={20}
              {...register('arrondissement')}
              className={inputClass}
            />
          </Field>
          <Field id='floor' label={t('floor')} error={errors.floor?.message}>
            <Input id='floor' {...register('floor')} className={inputClass} />
          </Field>
        </div>

        <Field
          id='code'
          label={t('code')}
          error={errors.code?.message}
          required
        >
          <Input
            id='code'
            {...register('code')}
            autoComplete='off'
            className={monoInputClass}
          />
        </Field>

        <Field
          id='instructions'
          label={t('instructions')}
          error={errors.instructions?.message}
        >
          <Input
            id='instructions'
            {...register('instructions')}
            className={inputClass}
          />
        </Field>

        <Field
          id='parking_hint'
          label={t('parking_hint')}
          error={errors.parking_hint?.message}
        >
          <Input
            id='parking_hint'
            {...register('parking_hint')}
            className={inputClass}
          />
        </Field>
      </fieldset>

      {serverError && (
        <p role='alert' className='text-sm text-destructive'>
          {t(`errors.${serverError}`)}
        </p>
      )}
      {success && (
        <p role='status' className='text-sm text-green-600'>
          {t('success')}
        </p>
      )}

      <Button
        type='submit'
        disabled={mutation.isPending}
        className='h-12 w-full inline-flex items-center justify-center gap-2 bg-[#FF6B35] text-base font-semibold text-white hover:bg-[#FF6B35]/90 disabled:opacity-60'
      >
        {mutation.isPending ? (
          <>
            <Loader2 className='h-5 w-5 animate-spin' aria-hidden />
            {t('submitting')}
          </>
        ) : (
          <>
            {t('submit')}
            <SaveAll className='h-5 w-5' aria-hidden />
          </>
        )}
      </Button>
    </form>
  )
}

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className='space-y-1.5'>
      <Label
        htmlFor={id}
        className='text-sm font-medium text-[#1B2838] dark:text-foreground'
      >
        {label}
        {required && (
          <span aria-hidden='true' className='ml-0.5 text-[#d91212]'>
            *
          </span>
        )}
        {required && <span className='sr-only'> (required)</span>}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className='text-xs text-destructive'>
          {error}
        </p>
      )}
    </div>
  )
}
