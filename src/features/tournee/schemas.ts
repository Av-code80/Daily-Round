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

// `tournee_id`, `order_index`, `location` (geocoded later) and
// derived fields are NOT on the form — they come from URL / server.
export const stopFormSchema = z
  .object({
    address: z
      .string()
      .trim()
      .min(3, 'Address is too short')
      .max(200, 'Address is too long'),
    time_window_start: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time')
      .or(z.literal('')),
    time_window_end: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time')
      .or(z.literal('')),
    priority: z.coerce.number().int().min(1).max(3),
    weight_kg: z
      .string()
      .trim()
      .regex(/^\d{1,4}(\.\d{1,2})?$/, 'Weight must be a number, max 9999.99')
      .or(z.literal('')),
    notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters'),
  })
  .refine(
    (data) =>
      !data.time_window_start ||
      !data.time_window_end ||
      data.time_window_start <= data.time_window_end,
    {
      message: 'End time must be after start time',
      path: ['time_window_end'],
    },
  )

export type StopFormValues = z.infer<typeof stopFormSchema>
