// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { extractLinesFromTranscript } from '@/features/invoicing/domain/voice-lines'
import { parseAmountToCents, type ExtractedLine } from '@/features/invoicing/utils'

// Live evals against the real model: they cost money and are not fully
// deterministic, so CI skips them. `npm run eval` opts in.
//
// Cases score what matters on an invoice rather than exact wording: line
// count, quantities, prices. Prices carry a stricter bar than the rest —
// an invented amount on a legal document is the one failure we cannot
// tolerate, so a single one fails the suite regardless of the overall
// score. The prompt's own examples are deliberately absent from these
// cases, so the score is not inflated by memorised answers.
//
// Transcripts are scored AFTER the grounding guardrail, because that is
// what ships. `guardrailHits` shows how often it had to step in.

type Expected = { mentions: string; quantity: string; unit_price: string }
type Case = { name: string; transcript: string; expected: Expected[] }

const CASES: Case[] = [
  {
    name: 'two services with spoken unit prices',
    transcript: "Trois tournées camionnette à 70 euros, plus une heure d'attente à 25 euros.",
    expected: [
      { mentions: 'tourn', quantity: '3', unit_price: '70' },
      { mentions: 'attente', quantity: '1', unit_price: '25' },
    ],
  },
  {
    name: 'French decimal comma',
    transcript: '150 colis à 1,20 euro le colis.',
    expected: [{ mentions: 'colis', quantity: '150', unit_price: '1,20' }],
  },
  {
    name: 'no price spoken — prices must stay empty',
    transcript: 'Deux tournées express et un supplément week-end.',
    expected: [
      { mentions: 'express', quantity: '2', unit_price: '' },
      { mentions: 'week', quantity: '1', unit_price: '' },
    ],
  },
  {
    name: 'total only — the model must not divide it',
    transcript: 'Cinq tournées pour un total de 300 euros.',
    expected: [{ mentions: 'tourn', quantity: '5', unit_price: '' }],
  },
  {
    name: 'hesitations and filler are ignored',
    transcript:
      "Euh alors, bon, pour la pharmacie, euh, deux tournées à 80 euros, voilà c'est tout.",
    expected: [{ mentions: 'tourn', quantity: '2', unit_price: '80' }],
  },
  {
    name: 'hours with a decimal quantity',
    transcript: "Trois heures et demie de livraison à 28 euros de l'heure.",
    expected: [{ mentions: 'livraison', quantity: '3,5', unit_price: '28' }],
  },
  {
    name: 'nothing billable',
    transcript:
      "Bonjour, c'est pour la facture de la semaine dernière, je rappellerai plus tard.",
    expected: [],
  },
  {
    name: 'three services in one breath',
    transcript:
      'Quatre tournées à 60, deux attentes à 15 et un forfait carburant à 40 euros.',
    expected: [
      { mentions: 'tourn', quantity: '4', unit_price: '60' },
      { mentions: 'attente', quantity: '2', unit_price: '15' },
      { mentions: 'carburant', quantity: '1', unit_price: '40' },
    ],
  },
  // Held out: added after the first run exposed the "un/une → 1" gap, with
  // words the prompt never mentions — checks the rule generalises instead
  // of passing only the two cases that revealed it.
  {
    name: 'indefinite article on unseen services',
    transcript: 'Une livraison urgente à 45 euros et un ramassage à 12 euros.',
    expected: [
      { mentions: 'livraison', quantity: '1', unit_price: '45' },
      { mentions: 'ramassage', quantity: '1', unit_price: '12' },
    ],
  },
]

const cents = (v: string) => (v === '' ? null : parseAmountToCents(v))
const qty = (v: string) => (v === '' ? null : Number(v.replace(',', '.')))

function score(expected: Expected[], got: ExtractedLine[]) {
  const failures: string[] = []
  let inventedPrices = 0

  if (got.length !== expected.length) {
    failures.push(`expected ${expected.length} lines, got ${got.length}`)
  }

  expected.forEach((exp, i) => {
    const line = got[i]
    if (!line) return
    if (!line.description.toLowerCase().includes(exp.mentions)) {
      failures.push(`line ${i}: "${line.description}" should mention "${exp.mentions}"`)
    }
    if (qty(line.quantity) !== qty(exp.quantity)) {
      failures.push(`line ${i}: qty ${line.quantity || '∅'} ≠ ${exp.quantity || '∅'}`)
    }
    if (cents(line.unit_price) !== cents(exp.unit_price)) {
      failures.push(`line ${i}: price ${line.unit_price || '∅'} ≠ ${exp.unit_price || '∅'}`)
      if (exp.unit_price === '' && line.unit_price !== '') inventedPrices++
    }
  })

  return { failures, inventedPrices }
}

describe.runIf(process.env.RUN_EVALS === '1')('voice → invoice lines (live eval)', () => {
  it('clears the accuracy bar and never invents a price', async () => {
    const results = await Promise.all(
      CASES.map(async (c) => {
        const result = await extractLinesFromTranscript(c.transcript)
        if (!result.ok) {
          return { name: c.name, failures: [`call failed: ${result.error}`], inventedPrices: 0, guardrailHits: 0 }
        }
        return {
          name: c.name,
          ...score(c.expected, result.data.lines),
          guardrailHits: result.data.ungroundedPrices,
        }
      }),
    )

    // eslint-disable-next-line no-console -- the printed table IS the eval report
    console.table(
      results.map((r) => ({
        case: r.name,
        pass: r.failures.length === 0,
        guardrailHits: r.guardrailHits,
        why: r.failures.join(' | '),
      })),
    )

    const passed = results.filter((r) => r.failures.length === 0).length
    const invented = results.reduce((sum, r) => sum + r.inventedPrices, 0)

    expect(invented).toBe(0)
    expect(passed / CASES.length).toBeGreaterThanOrEqual(0.875)
  }, 60_000)
})
