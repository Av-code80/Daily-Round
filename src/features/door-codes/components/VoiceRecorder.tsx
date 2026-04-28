'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { transcribeDoorCode } from '../actions'
import type { DoorCodeFormValues } from '../schemas'

type RecorderState = 'idle' | 'recording' | 'transcribing'

type Props = {
  onTranscribed: (data: Partial<DoorCodeFormValues>) => void
  onError: (error: string) => void
}

export function VoiceRecorder({ onTranscribed, onError }: Props) {
  const t = useTranslations('DoorCodes')
  const [state, setState] = useState<RecorderState>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream)
    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop())
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const file = new File([blob], 'recording.webm', { type: 'audio/webm' })

      setState('transcribing')
      const formData = new FormData()
      formData.append('audio', file)

      const result = await transcribeDoorCode(formData)
      if ('error' in result) {
        onError(result.error)
      } else {
        onTranscribed(result.data)
      }
      setState('idle')
    }

    mediaRecorder.start(100)
    setState('recording')
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
  }

  return (
    <div className='flex flex-col items-center gap-4 py-6'>
      {state === 'idle' && (
        <button
          type='button'
          onClick={async () => {
            try {
              await startRecording()
            } catch {
              onError('mic_denied')
            }
          }}
          className='w-20 h-20 rounded-full bg-[#FF6B35] hover:bg-orange-400 text-white text-3xl flex items-center justify-center shadow-lg shadow-orange-500/30 transition-all active:scale-95'
        >
          🎤
        </button>
      )}

      {state === 'recording' && (
        <button
          type='button'
          onClick={stopRecording}
          className='w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white text-3xl flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse transition-all active:scale-95'
        >
          ⏹
        </button>
      )}

      {state === 'transcribing' && (
        <div className='w-20 h-20 rounded-full bg-white/10 flex items-center justify-center'>
          <span className='w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin' />
        </div>
      )}

      <p className='text-white/50 text-sm'>
        {state === 'idle' && t('voice.tapToRecord')}
        {state === 'recording' && t('voice.tapToStop')}
        {state === 'transcribing' && t('voice.transcribing')}
      </p>
      {state === 'idle' && (
        <p className='text-white/30 text-xs text-center max-w-50'>
          {t('voice.hint')}
        </p>
      )}
    </div>
  )
}
