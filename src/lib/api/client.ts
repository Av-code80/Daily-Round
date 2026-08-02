import { z } from 'zod'
import { ApiError } from './errors'

const ErrorBodySchema = z
  .object({ error: z.string(), code: z.string().optional() })
  .catch({ error: 'An unexpected error occurred', code: undefined })

/**
 * Every response is PARSED against the caller's schema, never cast.
 * The API is a system boundary: what crosses it is unknown until proven.
 */
async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => ({}))
    const { error, code } = ErrorBodySchema.parse(body)
    throw new ApiError(error, code, response.status)
  }

  const data: unknown = await response.json()
  return schema.parse(data)
}

export const apiClient = {
  get: <T>(path: string, schema: z.ZodType<T>) =>
    request(path, schema, { method: 'GET' }),
  post: <T>(path: string, schema: z.ZodType<T>, body?: unknown) =>
    request(path, schema, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, schema: z.ZodType<T>, body: unknown) =>
    request(path, schema, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T>(path: string, schema: z.ZodType<T>) =>
    request(path, schema, { method: 'DELETE' }),
}