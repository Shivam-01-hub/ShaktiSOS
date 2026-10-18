import { describe, expect, it } from 'vitest'
import { hasPermission } from './access'

describe('access control', () => {
  it('allows user SOS trigger but blocks operator SOS trigger', () => {
    expect(hasPermission('user', 'sos:trigger')).toBe(true)
    expect(hasPermission('operator', 'sos:trigger')).toBe(false)
  })

  it('allows operator emergency monitoring', () => {
    expect(hasPermission('operator', 'emergency:monitor')).toBe(true)
  })
})
