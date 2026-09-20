'use client'

import { useTranslations } from 'next-intl'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintButton() {
  const t = useTranslations('Invoicing.document')

  return (
    <Button
      type='button'
      onClick={() => window.print()}
      className='h-9 bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90'
    >
      <Printer className='h-4 w-4' aria-hidden />
      {t('print')}
    </Button>
  )
}
