import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createDoorCode,
  transcribeDoorCode,
} from '@/features/door-codes/actions'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createServiceClient: vi.fn(),
  revalidateTag: vi.fn(),
  transcriptionsCreate: vi.fn(),
  completionsCreate: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: mocks.createServiceClient,
}))
vi.mock('next/cache', () => ({ revalidateTag: mocks.revalidateTag }))
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    audio: { transcriptions: { create: mocks.transcriptionsCreate } },
    chat: { completions: { create: mocks.completionsCreate } },
  })),
}))

const validInput = {
  address: '12 Rue de la Paix',
  city: 'Paris',
  code: '1234A',
  postal_code: '75001',
  arrondissement: '1',
  floor: '3',
  instructions: '',
  parking_hint: '',
}

describe('createDoorCode', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns Invalid_input when schema validation fails', async () => {
    const result = await createDoorCode({ ...validInput, address: 'X' })
    expect(result).toEqual({ ok: false, error: 'Invalid_input' })
  })

  it('returns not_authenticated when no session', async () => {
    mocks.auth.mockResolvedValue(null)
    const result = await createDoorCode(validInput)
    expect(result).toEqual({ ok: false, error: 'not_authenticated' })
  })

  it('returns db_error when Supabase insert fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' } })
    mocks.createServiceClient.mockReturnValue({
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({
              data: null,
              error: { code: '23505', message: 'duplicate key', details: '' },
            }),
          }),
        }),
      }),
    })
    const result = await createDoorCode(validInput)
    expect(result).toEqual({ ok: false, error: 'db_error' })
  })

  it('returns ok and id on success and revalidates the tag', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' } })
    mocks.createServiceClient.mockReturnValue({
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'code-123' }, error: null }),
          }),
        }),
      }),
    })
    const result = await createDoorCode(validInput)
    expect(result).toEqual({ ok: true, id: 'code-123' })
    expect(mocks.revalidateTag).toHaveBeenCalledWith('codes:75001', 'max')
  })
})

describe('transcribeDoorCode', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns no_audio when FormData has no audio file', async () => {
    const form = new FormData()
    const result = await transcribeDoorCode(form)
    expect(result).toEqual({ error: 'no_audio' })
  })

  it('returns transcription_failed when audio is under 3000 bytes', async () => {
    const form = new FormData()
    form.append(
      'audio',
      new File([new Uint8Array(100)], 'clip.webm', { type: 'audio/webm' }),
    )
    const result = await transcribeDoorCode(form)
    expect(result).toEqual({ error: 'transcription_failed' })
  })

  it('returns transcription_failed on Whisper hallucination string', async () => {
    const form = new FormData()
    form.append(
      'audio',
      new File([new Uint8Array(5000)], 'clip.webm', { type: 'audio/webm' }),
    )
    mocks.transcriptionsCreate.mockResolvedValue({
      text: "Sous-titres réalisés par la communauté d'Amara.org",
    })
    const result = await transcribeDoorCode(form)
    expect(result).toEqual({ error: 'transcription_failed' })
  })

  it('returns extraction_failed when GPT returns a wrong JSON shape', async () => {
    const form = new FormData()
    form.append(
      'audio',
      new File([new Uint8Array(5000)], 'clip.webm', { type: 'audio/webm' }),
    )
    mocks.transcriptionsCreate.mockResolvedValue({
      text: '12 rue de la Paix Paris',
    })
    mocks.completionsCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ foo: 'bar' }) } }],
    })
    const result = await transcribeDoorCode(form)
    expect(result).toEqual({ error: 'extraction_failed' })
  })

  it('returns extracted data on the happy path', async () => {
    const form = new FormData()
    form.append(
      'audio',
      new File([new Uint8Array(5000)], 'clip.webm', { type: 'audio/webm' }),
    )
    mocks.transcriptionsCreate.mockResolvedValue({
      text: '12 rue de la Paix Paris 75001 code B512 3ème étage',
    })
    const extracted = {
      address: '12 Rue de la Paix',
      city: 'Paris',
      postal_code: '75001',
      arrondissement: '1',
      code: 'B512',
      floor: '3',
      instructions: '',
      parking_hint: '',
    }
    mocks.completionsCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(extracted) } }],
    })
    const result = await transcribeDoorCode(form)
    expect(result).toEqual({ data: extracted })
  })
})
