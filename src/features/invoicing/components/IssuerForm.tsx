'use client'

import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { buildIssuerFormSchema, type IssuerFormValues } from '../schemas'
import { useSaveIssuer } from '../hooks/use-save-issuer'

const INPUT = 'h-12 w-full rounded-lg border border-foreground/20 px-3 text-sm'

const BLANK_ISSUER: IssuerFormValues = {
  company_name: '',
  siret: '',
  vat_number: '',
  address_line: '',
  postal_code: '',
  city: '',
  email: '',
  phone: '',
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className='mb-1 block text-sm font-medium'>
        {label}
      </label>
      {children}
      {error ? (
        <p className='mt-1 text-xs text-destructive'>{error}</p>
      ) : hint ? (
        <p className='mt-1 text-xs text-foreground/60'>{hint}</p>
      ) : null}
    </div>
  )
}

type Props = { defaultValues?: IssuerFormValues }

export function IssuerForm({ defaultValues }: Props) {
  const t = useTranslations('Invoicing.issuer')
  const tErrors = useTranslations('Invoicing.issuer.errors')
  const save = useSaveIssuer()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IssuerFormValues>({
    resolver: zodResolver(buildIssuerFormSchema(tErrors)),
    defaultValues: defaultValues ?? BLANK_ISSUER,
  })

  return (
    <form
      onSubmit={handleSubmit((values) => save.mutate(values))}
      className='space-y-4'
    >
      <Field
        id='company_name'
        label={t('companyName')}
        error={errors.company_name?.message}
        hint={t('companyNameHint')}
      >
        <input
          id='company_name'
          autoComplete='organization'
          className={INPUT}
          {...register('company_name')}
        />
      </Field>

      <div className='grid grid-cols-2 gap-4'>
        <Field id='siret' label={t('siret')} error={errors.siret?.message}>
          <input
            id='siret'
            inputMode='numeric'
            className={`${INPUT} font-mono`}
            {...register('siret')}
          />
        </Field>
        <Field
          id='vat_number'
          label={t('vatNumber')}
          error={errors.vat_number?.message}
          hint={t('vatNumberHint')}
        >
          <input
            id='vat_number'
            className={`${INPUT} font-mono`}
            {...register('vat_number')}
          />
        </Field>
      </div>

      <Field
        id='address_line'
        label={t('addressLine')}
        error={errors.address_line?.message}
      >
        <input
          id='address_line'
          autoComplete='street-address'
          className={INPUT}
          {...register('address_line')}
        />
      </Field>

      <div className='grid grid-cols-[1fr_2fr] gap-4'>
        <Field
          id='postal_code'
          label={t('postalCode')}
          error={errors.postal_code?.message}
        >
          <input
            id='postal_code'
            inputMode='numeric'
            autoComplete='postal-code'
            className={INPUT}
            {...register('postal_code')}
          />
        </Field>
        <Field id='city' label={t('city')} error={errors.city?.message}>
          <input
            id='city'
            autoComplete='address-level2'
            className={INPUT}
            {...register('city')}
          />
        </Field>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <Field id='email' label={t('email')} error={errors.email?.message}>
          <input
            id='email'
            type='email'
            autoComplete='email'
            className={INPUT}
            {...register('email')}
          />
        </Field>
        <Field id='phone' label={t('phone')} error={errors.phone?.message}>
          <input
            id='phone'
            type='tel'
            autoComplete='tel'
            className={INPUT}
            {...register('phone')}
          />
        </Field>
      </div>

      <Button
        type='submit'
        disabled={isSubmitting || save.isPending}
        className='h-14 w-full bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90'
      >
        {save.isPending ? t('saving') : t('save')}
      </Button>
    </form>
  )
}
