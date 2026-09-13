'use client'

import { useTranslations } from 'next-intl'
import { Loader2, Mic, Square } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder'
import { useVoiceLines } from '../hooks/use-voice-lines'
import type { VoiceLinesResponse } from '../services/invoice'

type Props = {
  onLinesAction: (result: VoiceLinesResponse) => void
}

// Voice is the primary input for a driver in the van, so the control gets
// a full-width 56px target rather than sitting beside "Add a line".
export function VoiceLinesButton({ onLinesAction }: Props) {
  const t = useTranslations('Invoicing.voice')
  const voice = useVoiceLines()
  const recorder = useAudioRecorder({
    onRecorded: (audio) => voice.mutate(audio, { onSuccess: onLinesAction }),
  })

  const start = async () => {
    try {
      await recorder.start()
    } catch {
      toast.error(t('errors.micDenied'))
    }
  }

  return (
    <div aria-live='polite'>
      {voice.isPending ? (
        <Button type='button' variant='outline' disabled className='h-14 w-full'>
          <Loader2 className='h-4 w-4 animate-spin' aria-hidden />
          {t('processing')}
        </Button>
      ) : recorder.status === 'recording' ? (
        <Button
          type='button'
          onClick={recorder.stop}
          className='h-14 w-full animate-pulse bg-destructive text-white hover:bg-destructive/90'
        >
          <Square className='h-4 w-4' aria-hidden />
          {t('stop')}
        </Button>
      ) : (
        <Button
          type='button'
          variant='outline'
          onClick={start}
          className='h-14 w-full border-[#FF6B35]/40 text-[#C4501F] hover:bg-[#FF6B35]/10'
        >
          <Mic className='h-4 w-4' aria-hidden />
          {t('dictate')}
        </Button>
      )}
    </div>
  )
}
