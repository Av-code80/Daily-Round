import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import type { DomainError } from '@/lib/api/errors'
import type { IssuerFormValues } from '../schemas'

type Result<T> = { ok: true; data: T } | { ok: false; error: DomainError }

// Optional fields arrive as empty strings from the form; the column is
// nullable, and NULL is the honest way to store "not provided".
const nullIfEmpty = (value: string) => (value === '' ? null : value)

/**
 * Upsert keyed on user_id: the settings form has no way of knowing
 * whether an identity already exists, and one row per driver is
 * guaranteed by the primary key rather than by the caller.
 */
export async function saveIssuer(
  userId: string,
  values: IssuerFormValues,
): Promise<Result<null>> {
  const supabase = createServiceClient()

  const { error } = await supabase.from('invoice_issuers').upsert(
    {
      user_id: userId,
      company_name: values.company_name,
      siret: values.siret,
      vat_number: nullIfEmpty(values.vat_number),
      address_line: values.address_line,
      postal_code: values.postal_code,
      city: values.city,
      email: nullIfEmpty(values.email),
      phone: nullIfEmpty(values.phone),
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    console.error('[saveIssuer] db error', { code: error.code })
    return { ok: false, error: 'db_error' }
  }

  return { ok: true, data: null }
}
