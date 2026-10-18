/**
 * Supabase surfaces two very different failures through the same `error`
 * field: a PostgREST error, which carries `code` and `details`, and a
 * transport failure (the network is down, the project is paused), which
 * carries only a `message`.
 *
 * Logging just `error.code` therefore prints an empty object for the
 * second kind — precisely the case where the log is the only clue you
 * have. This logs every field that is actually present, and falls back
 * to the raw value when none of the known ones are.
 */
export type DbErrorLike = {
  message?: string | null
  code?: string | null
  details?: string | null
  hint?: string | null
}

export function logDbError(
  scope: string,
  error: DbErrorLike | null | undefined,
  context: Record<string, unknown> = {},
): void {
  const payload: Record<string, unknown> = { ...context }

  if (error?.message) payload.message = error.message
  if (error?.code) payload.code = error.code
  if (error?.details) payload.details = error.details
  if (error?.hint) payload.hint = error.hint

  const recognised =
    error?.message || error?.code || error?.details || error?.hint
  if (!recognised) payload.unknownError = JSON.stringify(error) ?? String(error)

  console.error(scope, payload)
}
