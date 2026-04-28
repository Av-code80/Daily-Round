'use server'
import { auth } from '@/lib/auth'
import { DoorCodeFormValues, doorCodeSchema } from './schemas'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidateTag } from 'next/cache'
import OpenAI from 'openai'
import { z } from 'zod'
import { EXTRACTION_SYSTEM_PROMPT } from './utils/extraction-prompt'

const openai = new OpenAI()

const ExtractionSchema = z.object({
  address: z.string(),
  city: z.string(),
  postal_code: z.string(),
  arrondissement: z.string(),
  code: z.string(),
  floor: z.string(),
  instructions: z.string(),
  parking_hint: z.string(),
})

type CreateDoorCodeResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export async function createDoorCode(
  input: DoorCodeFormValues,
): Promise<CreateDoorCodeResult> {
  const parsed = doorCodeSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: 'Invalid_input' }
  }

  const session = await auth()

  if (!session?.user?.id) {
    return { ok: false, error: 'not_authenticated' }
  }

  const nullIfEmpty = (v: string) => (v === '' ? null : v)
  const {
    address,
    city,
    code,
    postal_code,
    arrondissement,
    floor,
    instructions,
    parking_hint,
  } = parsed.data

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('door_codes')
    .insert({
      address,
      city,
      code,
      postal_code: nullIfEmpty(postal_code),
      arrondissement: arrondissement === '' ? null : Number(arrondissement),
      floor: nullIfEmpty(floor),
      instructions: nullIfEmpty(instructions),
      parking_hint: nullIfEmpty(parking_hint),
      contributed_by: session.user.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createDoorCode] db error', {
      userId: session.user.id,
      code: error.code,
      message: error.message,
      details: error.details,
    })
    return { ok: false, error: 'db_error' }
  }

  revalidateTag(`codes:${postal_code || 'all'}`, 'max')
  return { ok: true, id: data.id }
}

export async function transcribeDoorCode(
  formData: FormData,
): Promise<{ data: Partial<DoorCodeFormValues> } | { error: string }> {
  const audio = formData.get('audio')
  if (!(audio instanceof File)) return { error: 'no_audio' }

  console.warn('[transcribeDoorCode] audio size (bytes):', audio.size)
  if (audio.size < 3000) return { error: 'transcription_failed' }

  const transcription = await openai.audio.transcriptions.create({
    file: audio,
    model: 'whisper-1',
    language: 'fr',
    // Anchors Whisper to the delivery domain — suppresses hallucinations on silence
    prompt: "Un livreur décrit une adresse en France : rue, ville, code postal, code d'accès, étage, instructions.",
  })
  console.warn('[transcribeDoorCode] transcript:', transcription.text)

  const HALLUCINATION = 'Sous-titres réalisés'
  if (!transcription.text || transcription.text.includes(HALLUCINATION)) {
    return { error: 'transcription_failed' }
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object'},
    messages: [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: transcription.text },
    ],
  })

const raw = completion.choices[0]?.message.content
  console.warn('[transcribeDoorCode] raw extraction:', raw)
  if (!raw) return { error: 'extraction_failed'}

  const result = ExtractionSchema.safeParse(JSON.parse(raw))
  if (!result.success) return { error: 'extraction_failed' }

  return { data: result.data }
}
