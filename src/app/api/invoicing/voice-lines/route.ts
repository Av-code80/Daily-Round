import { NextResponse } from 'next/server'
import { requireUserId, domainError } from '@/lib/api/route-helpers'
import { extractLinesFromAudio } from '@/features/invoicing/domain/voice-lines'

// Below this, MediaRecorder produced a container header and no speech;
// Whisper would turn the silence into hallucinated subtitles.
const MIN_AUDIO_BYTES = 3_000
// Far under Whisper's 25 MB cap: a few dictated sentences weigh well under
// 1 MB, so anything bigger is a mistake or abuse, not a longer invoice.
const MAX_AUDIO_BYTES = 5 * 1024 * 1024

// Nothing is written: this only proposes lines for the form. Every call
// spends OpenAI credits, which is why the session check comes first —
// before the body is even read.
export async function POST(request: Request) {
  const session = await requireUserId()
  if (!session.ok) return session.response

  // Reject oversized uploads from the header, before buffering the body.
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_AUDIO_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'Audio too large' }, { status: 413 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const audio = form.get('audio')
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: 'Missing audio file' }, { status: 400 })
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'Audio too large' }, { status: 413 })
  }
  if (audio.size < MIN_AUDIO_BYTES) return domainError('transcription_failed')

  const result = await extractLinesFromAudio(audio)
  if (!result.ok) return domainError(result.error)

  return NextResponse.json(result.data)
}
