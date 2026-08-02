import type { PaymentStatus, InvoiceStatus } from './schemas'

// ============================================================
// MONEY — integer cents only
// ============================================================
// Postgres `numeric(12,2)` is exact, but PostgREST hands it back as a
// JS float64. Never do decimal arithmetic on those values:
//   0.1 + 0.2 === 0.30000000000000004
// Every computation below converts to integer cents first, sums in
// integers, and formats only at the very end.

/**
 * Parses a user-typed amount into integer cents.
 * Accepts both "65.00" and "65,00" — a French driver types a comma.
 * Returns null when the input cannot be parsed.
 */
export function parseAmountToCents(input: string): number | null {
  const normalised = input.trim().replace(',', '.')
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(normalised)) return null

  const [whole, fraction = ''] = normalised.split('.')
  const cents = fraction.padEnd(2, '0').slice(0, 2)
  return Number(whole) * 100 + Number(cents)
}

/**
 * Converts a value coming FROM the database (float64) into cents.
 * Math.round is essential: 65.00 may arrive as 64.99999999999999.
 */
export function dbAmountToCents(amount: number): number {
  return Math.round(amount * 100)
}

/** Converts cents back to the decimal shape the database expects. */
export function centsToDbAmount(cents: number): number {
  return cents / 100
}

/** Formats cents for display: 32000 -> "320,00 €" */
export function formatCents(cents: number, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

/**
 * Line total in cents. Quantity may carry decimals (3.5 hours), so we
 * round the product — the rounding rule is applied once, here, and the
 * result is stored, never recomputed on read.
 */
export function lineTotalCents(quantity: string, unitPrice: string): number | null {
  const qty = Number(quantity.trim().replace(',', '.'))
  const priceCents = parseAmountToCents(unitPrice)
  if (!Number.isFinite(qty) || qty <= 0 || priceCents === null) return null
  return Math.round(qty * priceCents)
}

/** Sums line totals. Integer addition — no drift possible. */
export function sumLineTotalsCents(
  lines: ReadonlyArray<{ quantity: string; unit_price: string }>,
): number {
  return lines.reduce((total, line) => {
    const cents = lineTotalCents(line.quantity, line.unit_price)
    return cents === null ? total : total + cents
  }, 0)
}

// ============================================================
// DERIVED STATUS
// ============================================================
// 'overdue' exists nowhere in the database. It is computed from
// (finalised + unpaid + due date passed), so it can never go stale.

export type DisplayStatus = 'draft' | 'unpaid' | 'paid' | 'overdue'

export function displayStatus(invoice: {
  status: InvoiceStatus
  payment_status: PaymentStatus
  due_on: string | null
}): DisplayStatus {
  if (invoice.status === 'draft') return 'draft'
  if (invoice.payment_status === 'paid') return 'paid'
  if (invoice.due_on && invoice.due_on < todayIso()) return 'overdue'
  return 'unpaid'
}

/** Days past due. Negative means not due yet. */
export function daysOverdue(dueOn: string | null): number {
  if (!dueOn) return 0
  const due = new Date(`${dueOn}T00:00:00`)
  const today = new Date(`${todayIso()}T00:00:00`)
  return Math.round((today.getTime() - due.getTime()) / 86_400_000)
}

/** Local calendar date as YYYY-MM-DD — never UTC, the driver's day is local. */
function todayIso(): string {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

// ============================================================
// PERMISSIONS — one source of truth for the whole UI
// ============================================================
// The UI must announce constraints before the user acts. Every
// component asks these helpers instead of re-implementing the rule.

export function canEdit(status: InvoiceStatus): boolean {
  return status === 'draft'
}

export function canDelete(status: InvoiceStatus): boolean {
  return status === 'draft'
}

export function canChangePayment(status: InvoiceStatus): boolean {
  return status === 'finalised'
}

export function canFinalise(invoice: {
  status: InvoiceStatus
  lineCount: number
}): boolean {
  return invoice.status === 'draft' && invoice.lineCount > 0
}