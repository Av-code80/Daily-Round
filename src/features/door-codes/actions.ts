'use server'
import { auth } from '@/lib/auth'
import { DoorCodeFormValues, doorCodeSchema } from './schemas'
import { createServiceClient } from '@/lib/supabase/service'

type CreateDoorCodeResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export async function createDoorCode(
  input: DoorCodeFormValues,
): Promise<CreateDoorCodeResult> {
  const parsed = doorCodeSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: 'Invalid_input' }
  }

  const session = await auth()

  if (!session?.user?.id) {
    return { ok: false, error: 'not_authenticated' }
  }

  const nullIfEmpty = (v: string) => (v === '' ? null : v)
  const {
    address,
    city,
    code,
    postal_code,
    arrondissement,
    floor,
    instructions,
    parking_hint,
  } = parsed.data

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('door_codes')
    .insert({
      address,
      city,
      code,
      postal_code: nullIfEmpty(postal_code),
      arrondissement: arrondissement === '' ? null : Number(arrondissement),
      floor: nullIfEmpty(floor),
      instructions: nullIfEmpty(instructions),
      parking_hint: nullIfEmpty(parking_hint),
      contributed_by: session.user.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createDoorCode] db error', {
      userId: session.user.id,
      code: error.code,
      message: error.message,
      details: error.details,
    })
    return { ok: false, error: 'db_error' }
  }

  return { ok: true, id: data.id }
}
