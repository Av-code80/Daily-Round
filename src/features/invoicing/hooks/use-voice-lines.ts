'use client'

import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/errors'
import { transcribeLines } from '../services/invoice'

// No cache invalidation: dictation only proposes lines to the form and
// writes nothing. The draft changes when the driver presses Save.
export function useVoiceLines() {
  const t = useTranslations('Invoicing.voice')

  return useMutation({
    mutationFn: transcribeLines,
    onError: (error: Error) => {
      if (error instanceof ApiError && error.code === 'transcription_failed') {
        return toast.error(t('errors.transcriptionFailed'))
      }
      toast.error(t('errors.generic'))
    },
  })
}
