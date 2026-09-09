'use client'

import { useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  invoiceFormSchema,
  type InvoiceFormValues,
  VAT_REGIMES,
  BILLING_UNITS,
} from '../schemas'
import { useClientSearch } from '../hooks/use-client-search'
import { useCreateInvoice } from '../hooks/use-create-invoice'
import { useUpdateInvoice } from '../hooks/use-update-invoice'
import { InvoiceLineRow } from './InvoiceLineRow'
import { FinaliseInvoiceButton } from './FinaliseInvoiceButton'

const EMPTY_LINE = { description: '', quantity: '', unit_price: '' }

const BLANK_INVOICE: InvoiceFormValues = {
  client_id: '',
  vat_regime: 'franchise',
  billing_unit: 'tournee',
  notes: '',
  lines: [EMPTY_LINE],
}

type ClientOption = {
  id: string
  name: string
  min_billable_quantity: number | null
}

/** `invoiceId` switches the form from creation to editing an existing draft. */
type Props = {
  invoiceId?: string
  defaultValues?: InvoiceFormValues
  /** The draft's own client, which the async search may not have loaded yet. */
  initialClient?: ClientOption | null
}

export function InvoiceForm({ invoiceId, defaultValues, initialClient }: Props) {
  const t = useTranslations('Invoicing.form')
  const [clientTerm, setClientTerm] = useState('')
  const { options: clients } = useClientSearch(clientTerm)
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: defaultValues ?? BLANK_INVOICE,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })

  // The draft's client must always have an <option>, even before the
  // search results land: a <select> whose value matches no option falls
  // back to the placeholder and the form silently loses its client.
  const options =
    initialClient && !clients.some((c) => c.id === initialClient.id)
      ? [initialClient, ...clients]
      : clients

  // Floor comes from the selected client, not from a separate lookup —
  // the same list we render already carries min_billable_quantity.
  const selectedClientId = useWatch({ control, name: 'client_id' })
  const floor =
    options.find((c) => c.id === selectedClientId)?.min_billable_quantity ?? null

  const onSubmit = (values: InvoiceFormValues) => {
    if (invoiceId) updateInvoice.mutate({ invoiceId, values })
    else createInvoice.mutate(values)
  }

  const isPending = createInvoice.isPending || updateInvoice.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div>
        <label htmlFor='client-search' className='mb-1 block text-sm font-medium'>
          {t('client')}
        </label>
        <input
          id='client-search'
          placeholder={t('clientSearchPlaceholder')}
          value={clientTerm}
          onChange={(e) => setClientTerm(e.target.value)}
          className='mb-2 h-12 w-full rounded-lg border border-foreground/20 px-3 text-sm'
        />
        <select
          id='client_id'
          {...register('client_id')}
          className='h-12 w-full rounded-lg border border-foreground/20 px-3 text-sm'
        >
          <option value=''>{t('selectClient')}</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.client_id && (
          <p className='mt-1 text-xs text-destructive'>{errors.client_id.message}</p>
        )}
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label htmlFor='vat_regime' className='mb-1 block text-sm font-medium'>
            {t('vatRegime')}
          </label>
          <select
            id='vat_regime'
            {...register('vat_regime')}
            className='h-12 w-full rounded-lg border border-foreground/20 px-3 text-sm'
          >
            {VAT_REGIMES.map((regime) => (
              <option key={regime} value={regime}>
                {t(`vatRegimeOptions.${regime}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor='billing_unit' className='mb-1 block text-sm font-medium'>
            {t('billingUnit')}
          </label>
          <select
            id='billing_unit'
            {...register('billing_unit')}
            className='h-12 w-full rounded-lg border border-foreground/20 px-3 text-sm'
          >
            {BILLING_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {t(`billingUnitOptions.${unit}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='space-y-3'>
        {fields.map((field, index) => (
          <InvoiceLineRow
            key={field.id}
            control={control}
            register={register}
            index={index}
            floor={floor}
            onRemoveAction={() => remove(index)}
            canRemove={fields.length > 1}
          />
        ))}
        {errors.lines?.message && (
          <p className='text-xs text-destructive'>{errors.lines.message}</p>
        )}
        <Button
          type='button'
          variant='outline'
          onClick={() => append(EMPTY_LINE)}
          className='h-11'
        >
          <Plus className='h-4 w-4' aria-hidden />
          {t('addLine')}
        </Button>
      </div>

      <div>
        <label htmlFor='notes' className='mb-1 block text-sm font-medium'>
          {t('notes')}
        </label>
        <textarea
          id='notes'
          {...register('notes')}
          rows={3}
          className='w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm'
        />
      </div>

      <div className='flex flex-col gap-3'>
        <Button
          type='submit'
          disabled={isSubmitting || isPending}
          className='h-14 w-full bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90'
        >
          {invoiceId
            ? isPending
              ? t('saving')
              : t('save')
            : isPending
              ? t('submitting')
              : t('submit')}
        </Button>

        {/* Finalisation is only offered once the draft exists — it freezes
            whatever is stored, not what is currently typed. */}
        {invoiceId && (
          <FinaliseInvoiceButton invoiceId={invoiceId} lineCount={fields.length} />
        )}
      </div>
    </form>
  )
}