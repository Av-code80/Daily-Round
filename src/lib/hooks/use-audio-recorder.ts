'use client'

import { useEffect, useRef, useState } from 'react'

export type RecorderStatus = 'idle' | 'recording'

type Options = {
  /** Receives the finished recording once the user stops. */
  onRecorded: (file: File) => void
  /** Auto-stop, so a forgotten recording cannot grow without bound. */
  maxDurationMs?: number
}

/**
 * MediaRecorder mechanics shared by every voice input. What happens to the
 * audio afterwards (server action, REST call) and the "processing" state
 * belong to the caller.
 */
export function useAudioRecorder({ onRecorded, maxDurationMs = 60_000 }: Options) {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // `onstop` fires long after `start()` captured its closure. Reading the
  // callback through a ref means a parent re-render in between can never
  // hand the recording to a stale handler.
  const onRecordedRef = useRef(onRecorded)
  useEffect(() => {
    onRecordedRef.current = onRecorded
  })

  // Release the mic on unmount: otherwise the browser's recording
  // indicator stays on after the user navigates away mid-recording.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  /** Throws when the microphone is denied — the caller decides how to say so. */
  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    streamRef.current = stream
    recorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      stream.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setStatus('idle')

      // Safari records audio/mp4, Chrome audio/webm. Label the file with
      // what the browser actually produced, or Whisper rejects the upload.
      const type = (recorder.mimeType || 'audio/webm').split(';')[0]
      const extension = type.includes('mp4') ? 'mp4' : 'webm'
      const blob = new Blob(chunksRef.current, { type })
      onRecordedRef.current(new File([blob], `recording.${extension}`, { type }))
    }

    // A timeslice makes the browser flush chunks while recording, so even
    // a short clip has data by the time stop() runs.
    recorder.start(100)
    setStatus('recording')

    timerRef.current = setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop()
    }, maxDurationMs)
  }

  const stop = () => recorderRef.current?.stop()

  return { status, start, stop }
}
