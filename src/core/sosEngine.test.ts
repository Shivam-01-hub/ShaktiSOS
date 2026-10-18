import { describe, expect, it } from 'vitest'
import { cancelCountdown, createCountdownSession, tickCountdown } from './sosEngine'

describe('sosEngine', () => {
  it('starts in countdown mode', () => {
    const session = createCountdownSession('u-1')
    expect(session.status).toBe('countdown')
    expect(session.countdownRemaining).toBe(15)
  })

  it('activates when countdown reaches zero', () => {
    let session = createCountdownSession('u-1')
    for (let i = 0; i < 15; i += 1) {
      session = tickCountdown(session)
    }
    expect(session.status).toBe('active')
    expect(session.satelliteMessages.length).toBeGreaterThan(0)
  })

  it('supports cancellation', () => {
    const cancelled = cancelCountdown(createCountdownSession('u-1'))
    expect(cancelled.status).toBe('resolved')
  })
})
