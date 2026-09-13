import 'server-only'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import type { DomainError } from '@/lib/api/errors'
import { sanitizeExtractedLines, type ExtractedLine } from '../utils'

type Result<T> = { ok: true; data: T } | { ok: false; error: DomainError }

export type ExtractedLines = {
  lines: ExtractedLine[]
  ungroundedPrices: number
}

export type VoiceLinesResult = ExtractedLines & { transcript: string }

// Built on first use, not at import: CI imports this module for its unit
// tests and must not need an OpenAI key to do so.
let client: OpenAI | null = null
function openai() {
  return (client ??= new OpenAI())
}

// Anchors Whisper to the domain: on silence or noise it otherwise "hears"
// generic subtitles instead of returning nothing.
const WHISPER_PROMPT =
  'Un chauffeur-livreur indépendant dicte les lignes de sa facture : prestations, quantités, prix unitaires en euros.'

// Whisper's best-known hallucination on near-silent French audio.
const HALLUCINATION_MARKERS = ['Sous-titres réalisés', 'Amara.org']

// Strict Structured Outputs: every field is required, so "not said" has
// to be an explicit empty string rather than a missing key.
const extractionSchema = z.object({
  lines: z.array(
    z.object({
      description: z.string(),
      quantity: z.string(),
      unit_price: z.string(),
    }),
  ),
})

const EXTRACTION_PROMPT = `You convert a French delivery driver's dictation into invoice lines.

Each line is one billed service: a delivery round ("tournée"), waiting time ("attente"), parcels ("colis"), hours, a flat fee or a supplement.

For each line return:
- description: a short French label for the service, first letter capitalised ("Tournée camionnette", "Attente").
- quantity: how many, as digits ("4", "3,5"). A service introduced by "un" or "une" has quantity "1" ("une tournée", "un aller-retour"). Empty string only if no quantity is stated or implied.
- unit_price: the price of ONE unit in euros, as digits with a comma or dot for decimals ("65", "1,20").

Rules:
- NEVER invent, estimate or compute a price. If no unit price is spoken for a line, unit_price is "".
- If only a TOTAL is spoken for a line ("4 tournées pour 260 euros"), do NOT divide it: keep the quantity and leave unit_price "".
- One service, one line: do not merge distinct services, do not split one.
- Ignore anything that is not a billed service: hesitations, greetings, client names, dates.
- If nothing billable is said, return an empty lines array.

Examples:
"Quatre tournées camionnette à 65 euros et deux heures d'attente à 30 euros."
→ {"lines":[{"description":"Tournée camionnette","quantity":"4","unit_price":"65"},{"description":"Attente","quantity":"2","unit_price":"30"}]}

"Une tournée express, et 120 colis."
→ {"lines":[{"description":"Tournée express","quantity":"1","unit_price":""},{"description":"Colis","quantity":"120","unit_price":""}]}`

function errorName(error: unknown) {
  return error instanceof Error ? error.name : 'unknown'
}

/**
 * Text → lines. Split from transcription so the evals can score the LLM
 * step on its own, without audio fixtures.
 */
export async function extractLinesFromTranscript(
  transcript: string,
): Promise<Result<ExtractedLines>> {
  try {
    const completion = await openai().chat.completions.parse({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: transcript },
      ],
      response_format: zodResponseFormat(extractionSchema, 'invoice_lines'),
    })

    // null on a refusal or an empty answer.
    const parsed = completion.choices[0]?.message.parsed
    if (!parsed) return { ok: false, error: 'extraction_failed' }

    return { ok: true, data: sanitizeExtractedLines(parsed.lines, transcript) }
  } catch (error) {
    // The transcript is never logged: it can name clients and amounts.
    console.error('[extractLinesFromTranscript] openai error', { name: errorName(error) })
    return { ok: false, error: 'extraction_failed' }
  }
}

export async function extractLinesFromAudio(
  audio: File,
): Promise<Result<VoiceLinesResult>> {
  let transcript: string
  try {
    const transcription = await openai().audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'fr',
      prompt: WHISPER_PROMPT,
    })
    transcript = transcription.text.trim()
  } catch (error) {
    console.error('[extractLinesFromAudio] whisper error', { name: errorName(error) })
    return { ok: false, error: 'transcription_failed' }
  }

  if (!transcript || HALLUCINATION_MARKERS.some((m) => transcript.includes(m))) {
    return { ok: false, error: 'transcription_failed' }
  }

  const extracted = await extractLinesFromTranscript(transcript)
  if (!extracted.ok) return extracted

  return { ok: true, data: { ...extracted.data, transcript } }
}
