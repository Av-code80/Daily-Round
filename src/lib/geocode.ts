import 'server-only'

type Coords = { lat: number; lng: number }

/**
 * Mapbox forward-geocoding. Server-side only (uses MAPBOX_TOKEN).
 * Biased to France since DailyRound's drivers operate there.
 * Returns null on any failure — never throws.
 */
export async function geocodeAddress(address: string): Promise<Coords | null> {
  const token = process.env.MAPBOX_TOKEN
  if (!token) {
    console.warn('[geocode] MAPBOX_TOKEN missing')
    return null
  }

  const encoded = encodeURIComponent(address)
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json` +
    `?country=FR&limit=1&access_token=${token}`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.error('[geocode] http error', { status: res.status })
      return null
    }
    const json = (await res.json()) as {
      features?: Array<{ center?: [number, number] }>
    }
    const center = json.features?.[0]?.center
    if (!center || center.length !== 2) return null

    // Mapbox returns [lng, lat]; we expose them as named fields to remove ambiguity.
    const [lng, lat] = center
    return { lat, lng }
  } catch (err) {
    console.error('[geocode] network error', { err: String(err) })
    return null
  }
}
