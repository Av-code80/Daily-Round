import { z } from 'zod'

// Keep every list below in sync with the Postgres enums
// (supabase/migrations/20260730100000_invoicing_module.sql).

export const INVOICE_KINDS = ['invoice', 'credit_note'] as const
export const invoiceKindSchema = z.enum(INVOICE_KINDS)
export type InvoiceKind = z.infer<typeof invoiceKindSchema>

// Axis 1 — legal state. One-way: draft -> finalised, never back.
export const INVOICE_STATUSES = ['draft', 'finalised'] as const
export const invoiceStatusSchema = z.enum(INVOICE_STATUSES)
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>

// Axis 2 — payment. The only mutable field once finalised.
// 'overdue' is deliberately absent: it is derived from
// (unpaid + due_on passed), never stored, never chosen by hand.
export const PAYMENT_STATUSES = ['unpaid', 'paid'] as const
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES)
export type PaymentStatus = z.infer<typeof paymentStatusSchema>

export const VAT_REGIMES = ['franchise', 'standard'] as const
export const vatRegimeSchema = z.enum(VAT_REGIMES)
export type VatRegime = z.infer<typeof vatRegimeSchema>

export const BILLING_UNITS = ['tournee', 'parcel', 'hour'] as const
export const billingUnitSchema = z.enum(BILLING_UNITS)
export type BillingUnit = z.infer<typeof billingUnitSchema>

// French money input: accepts both "65.00" and "65,00" — a French
// driver types a comma. Normalisation to cents happens in utils.ts.
const amountSchema = z
  .string()
  .trim()
  .regex(/^\d{1,9}([.,]\d{1,2})?$/, 'Amount must be a number, max 2 decimals')

// ============================================================
// CLIENT
// ============================================================
export const clientFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name is too short')
    .max(120, 'Name is too long'),
  // 14 digits — mirrors the DB CHECK constraint
  siret: z
    .string()
    .trim()
    .regex(/^\d{14}$/, 'SIRET must be exactly 14 digits')
    .or(z.literal('')),
  vat_number: z
    .string()
    .trim()
    .regex(/^FR\d{11}$/, 'VAT number format: FR + 11 digits')
    .or(z.literal('')),
  address_line: z.string().trim().max(200, 'Address is too long'),
  postal_code: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'Postal code must be 5 digits')
    .or(z.literal('')),
  city: z.string().trim().max(100, 'City is too long'),
  email: z.string().trim().email('Invalid email').or(z.literal('')),
  payment_terms_days: z.coerce
    .number()
    .int()
    .min(0, 'Cannot be negative')
    .max(90, 'Legal maximum is 60 days (90 in agreed cases)'),
})

export type ClientFormValues = z.infer<typeof clientFormSchema>

// ============================================================
// INVOICE LINE
// ============================================================
export const invoiceLineSchema = z.object({
  description: z
    .string()
    .trim()
    .min(2, 'Description is required')
    .max(200, 'Description is too long'),
  quantity: z
    .string()
    .trim()
    .regex(/^\d{1,6}([.,]\d{1,2})?$/, 'Quantity must be a positive number')
    .refine((v) => Number(v.replace(',', '.')) > 0, 'Quantity must be at least 1'),
  unit_price: amountSchema,
})

export type InvoiceLineValues = z.infer<typeof invoiceLineSchema>

// ============================================================
// INVOICE (draft creation)
// ============================================================
// `number`, `issued_on`, `due_on` and totals are NOT on the form:
// they are assigned server-side by finalise_invoice().
export const invoiceFormSchema = z
  .object({
    client_id: z.string().uuid('Select a client'),
    vat_regime: vatRegimeSchema,
    billing_unit: billingUnitSchema,
    notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters'),
    lines: z
      .array(invoiceLineSchema)
      .min(1, 'An invoice needs at least one line'),
  })
  .refine(
    (data) =>
      data.vat_regime !== 'franchise' ||
      data.lines.every((l) => l.unit_price !== ''),
    {
      message: 'Every line needs a unit price',
      path: ['lines'],
    },
  )

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>