'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useFinaliseInvoice } from '../hooks/use-finalise-invoice'

type Props = {
  invoiceId: string
  lineCount: number
}

export function FinaliseInvoiceButton({ invoiceId, lineCount }: Props) {
  const t = useTranslations('Invoicing.finalise')
  const [open, setOpen] = useState(false)
  const mutation = useFinaliseInvoice()

  // Announce the constraint instead of silently disabling the button.
  const blocked = lineCount === 0

  return (
    <>
      <Button
        type='button'
        onClick={() => setOpen(true)}
        disabled={blocked}
        className='h-14 bg-[#FF6B35] px-6 text-white hover:bg-[#FF6B35]/90'
      >
        {t('cta')}
      </Button>

      {blocked && (
        <p className='mt-2 text-xs text-foreground/60'>{t('blockedNoLines')}</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmTitle')}</DialogTitle>
            <DialogDescription>{t('confirmNumber')}</DialogDescription>
          </DialogHeader>

          <ul className='space-y-2 text-sm'>
            <li className='flex items-start gap-2'>
              <Check className='mt-0.5 h-4 w-4 shrink-0 text-emerald-600' aria-hidden />
              <span className='text-foreground/70'>{t('canSend')}</span>
            </li>
            <li className='flex items-start gap-2'>
              <X className='mt-0.5 h-4 w-4 shrink-0 text-destructive' aria-hidden />
              <span className='text-foreground/70'>{t('cannotEdit')}</span>
            </li>
            <li className='flex items-start gap-2'>
              <X className='mt-0.5 h-4 w-4 shrink-0 text-destructive' aria-hidden />
              <span className='text-foreground/70'>{t('cannotDelete')}</span>
            </li>
          </ul>

          <DialogFooter className='gap-2 sm:gap-2'>
            {/* Cancel first: the safe choice is the default focus target */}
            <Button
              type='button'
              variant='outline'
              className='h-14'
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              {t('cancel')}
            </Button>
            <Button
              type='button'
              className='h-14 bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90'
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate(invoiceId, {
                  onSuccess: () => setOpen(false),
                })
              }
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' aria-hidden />
                  {t('pending')}
                </>
              ) : (
                t('cta')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}