'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DoorCodesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('DoorCodes.error')

  useEffect(() => {
    console.error('[door-codes/error]', error)
  }, [error])

  return (
    <div className='mx-auto max-w-2xl p-4'>
      <div className='flex flex-col items-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-10 text-center'>
        <AlertCircle className='h-8 w-8 text-destructive' aria-hidden />
        <div>
          <p className='font-semibold'>{t('title')}</p>
          <p className='text-sm text-[#1B2838]/60'>{t('hint')}</p>
        </div>
        <Button onClick={reset} variant='outline'>{t('retry')}</Button>
      </div>
    </div>
  )
}
