// Business errors, shared by every module. Transport-agnostic:
// the domain returns these, the HTTP layer maps them to status codes.
export type DomainError =
  | 'not_found'
  | 'forbidden'
  | 'already_finalised'
  | 'no_lines'
  | 'db_error'

/**
 * Normalised client-side error. `code` carries the business meaning
 * (e.g. 'already_finalised') so callers branch on a stable value
 * instead of parsing a message.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}