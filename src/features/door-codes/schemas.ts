import { z } from 'zod'

// Allow letters (incl. French accents), numbers, spaces, common address punctuation.
const ADDRESS_REGEX = /^[\p{L}\p{N}\s',.\-°/]+$/u

// Letters (incl. accents) + spaces + hyphens + apostrophes only.
const CITY_REGEX = /^[\p{L}\s'\-]+$/u

export const doorCodeSchema = z.object({
  address: z
    .string()
    .trim()
    .min(5, 'Address must be at least 5 characters')
    .max(200)
    .regex(ADDRESS_REGEX, 'Only letters, numbers, spaces and , . - / allowed'),
  city: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(CITY_REGEX, 'City can only contain letters'),
  code: z.string().trim().min(2).max(20),
  postal_code: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'Invalid French postal code')
    .or(z.literal('')),
  arrondissement: z
    .string()
    .trim()
    .regex(/^(?:[1-9]|1[0-9]|20)$/, 'Must be 1–20')
    .or(z.literal('')),
  floor: z.string().trim().max(20),
  instructions: z.string().trim().max(500),
  parking_hint: z.string().trim().max(300),
})

export type DoorCodeFormValues = z.infer<typeof doorCodeSchema>
