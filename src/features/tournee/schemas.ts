import { z } from 'zod'

// Allowed vehicle types — keep in sync with the DB CHECK constraint
export const VEHICLE_TYPES = ['bike', 'scooter', 'car', 'van', 'truck'] as const
export const vehicleTypeSchema = z.enum(VEHICLE_TYPES)
export type VehicleType = z.infer<typeof vehicleTypeSchema>

// Matches the existing `tournee_status` Postgres enum (initial_schema.sql).
export const TOURNEE_STATUSES = ['pending', 'in_progress', 'completed'] as const
export const tourneeStatusSchema = z.enum(TOURNEE_STATUSES)
export type TourneeStatus = z.infer<typeof tourneeStatusSchema>

// What the driver fills out to create a daily round.
// `name` is auto-generated server-side from the date — not on the form.
export const tourneeFormSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  vehicle_type: vehicleTypeSchema,
  parcel_count: z
    .string()
    .trim()
    .regex(/^\d{1,4}$/, 'Must be a whole number 0–9999')
    .or(z.literal('')),
  notes: z
    .string()
    .trim()
    .max(500, 'Notes cannot exceed 500 characters'),
})

export type TourneeFormValues = z.infer<typeof tourneeFormSchema>
