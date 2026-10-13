import { describe, it, expect } from 'vitest'
import { sirenFromSiret } from '@/features/invoicing/utils'

describe('sirenFromSiret', () => {
  it('takes the first nine digits of a SIRET', () => {
    expect(sirenFromSiret('43912875300038')).toBe('439128753')
  })

  it('tolerates the spacing humans type', () => {
    expect(sirenFromSiret('439 128 753 00038')).toBe('439128753')
  })

  it('returns null when there is no SIRET on file', () => {
    expect(sirenFromSiret(null)).toBeNull()
  })

  // Printing a plausible-but-wrong identifier on a legal document is
  // worse than printing none at all.
  it('refuses to guess from a malformed SIRET', () => {
    expect(sirenFromSiret('439128753')).toBeNull()
    expect(sirenFromSiret('4391287530003X')).toBeNull()
    expect(sirenFromSiret('')).toBeNull()
  })
})
