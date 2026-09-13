import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sanitizeExtractedLines, MAX_VOICE_LINES } from '@/features/invoicing/utils'
import { extractLinesFromAudio } from '@/features/invoicing/domain/voice-lines'

const mocks = vi.hoisted(() => ({
  transcriptionsCreate: vi.fn(),
  completionsParse: vi.fn(),
}))

// A class, not an arrow function: the module under test calls `new OpenAI()`.
vi.mock('openai', () => ({
  default: class {
    audio = { transcriptions: { create: mocks.transcriptionsCreate } }
    chat = { completions: { parse: mocks.completionsParse } }
  },
}))

const line = (description: string, quantity: string, unit_price: string) => ({
  description,
  quantity,
  unit_price,
})

describe('sanitizeExtractedLines', () => {
  it('keeps a unit price the driver actually said', () => {
    const result = sanitizeExtractedLines([line('Tournée', '4', '65')], '4 tournées à 65 euros')
    expect(result).toEqual({ lines: [line('Tournée', '4', '65')], ungroundedPrices: 0 })
  })

  it('blanks a price that appears nowhere in the transcript', () => {
    const result = sanitizeExtractedLines([line('Tournée', '4', '65')], 'quatre tournées')
    expect(result).toEqual({ lines: [line('Tournée', '4', '')], ungroundedPrices: 1 })
  })

  it('refuses a unit price the model computed from a spoken total', () => {
    const result = sanitizeExtractedLines(
      [line('Tournée', '4', '65')],
      '4 tournées pour 260 euros',
    )
    expect(result.lines[0].unit_price).toBe('')
    expect(result.ungroundedPrices).toBe(1)
  })

  it('treats the French decimal comma and the dot as the same amount', () => {
    const result = sanitizeExtractedLines([line('Colis', '150', '1,20')], '150 colis à 1.20 €')
    expect(result.lines[0].unit_price).toBe('1,20')
  })

  it('does not count a price that was never proposed', () => {
    const result = sanitizeExtractedLines([line('Attente', '2', '')], "2 heures d'attente")
    expect(result.ungroundedPrices).toBe(0)
  })

  it('drops lines without a usable description', () => {
    const result = sanitizeExtractedLines(
      [line('', '1', ''), line('x', '1', ''), line('Tournée', '1', '')],
      '',
    )
    expect(result.lines).toEqual([line('Tournée', '1', '')])
  })

  it('blanks quantities that are not positive numbers', () => {
    const result = sanitizeExtractedLines(
      [line('Tournée', 'quatre', ''), line('Attente', '0', '')],
      '',
    )
    expect(result.lines.map((l) => l.quantity)).toEqual(['', ''])
  })

  it(`caps the output at ${MAX_VOICE_LINES} lines`, () => {
    const many = Array.from({ length: MAX_VOICE_LINES + 5 }, (_, i) =>
      line(`Ligne ${i}`, '1', ''),
    )
    expect(sanitizeExtractedLines(many, '').lines).toHaveLength(MAX_VOICE_LINES)
  })
})

const audio = () => new File([new Uint8Array(5000)], 'clip.webm', { type: 'audio/webm' })

describe('extractLinesFromAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rejects the Whisper silence hallucination without calling the model', async () => {
    mocks.transcriptionsCreate.mockResolvedValue({
      text: "Sous-titres réalisés par la communauté d'Amara.org",
    })
    expect(await extractLinesFromAudio(audio())).toEqual({
      ok: false,
      error: 'transcription_failed',
    })
    expect(mocks.completionsParse).not.toHaveBeenCalled()
  })

  it('maps a Whisper outage to transcription_failed', async () => {
    mocks.transcriptionsCreate.mockRejectedValue(new Error('503'))
    expect(await extractLinesFromAudio(audio())).toEqual({
      ok: false,
      error: 'transcription_failed',
    })
  })

  it('maps a model refusal to extraction_failed', async () => {
    mocks.transcriptionsCreate.mockResolvedValue({ text: '4 tournées à 65 euros' })
    mocks.completionsParse.mockResolvedValue({
      choices: [{ message: { parsed: null, refusal: 'refused' } }],
    })
    expect(await extractLinesFromAudio(audio())).toEqual({
      ok: false,
      error: 'extraction_failed',
    })
  })

  it('maps a model outage to extraction_failed', async () => {
    mocks.transcriptionsCreate.mockResolvedValue({ text: '4 tournées à 65 euros' })
    mocks.completionsParse.mockRejectedValue(new Error('429'))
    expect(await extractLinesFromAudio(audio())).toEqual({
      ok: false,
      error: 'extraction_failed',
    })
  })

  it('returns grounded lines alongside the transcript', async () => {
    const transcript = "4 tournées à 65 euros et 2 heures d'attente"
    mocks.transcriptionsCreate.mockResolvedValue({ text: transcript })
    mocks.completionsParse.mockResolvedValue({
      choices: [
        {
          message: {
            parsed: { lines: [line('Tournée', '4', '65'), line('Attente', '2', '30')] },
          },
        },
      ],
    })
    expect(await extractLinesFromAudio(audio())).toEqual({
      ok: true,
      data: {
        lines: [line('Tournée', '4', '65'), line('Attente', '2', '')],
        ungroundedPrices: 1,
        transcript,
      },
    })
  })
})
