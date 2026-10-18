import type { EmergencySession } from '../types'

const COUNTDOWN_START = 15

export const createCountdownSession = (userId: string): EmergencySession => ({
  id: `SOS-${Date.now()}`,
  userId,
  startedAt: new Date().toISOString(),
  status: 'countdown',
  countdownRemaining: COUNTDOWN_START,
  satelliteMessages: [],
  locationTrail: [],
})

export const tickCountdown = (session: EmergencySession): EmergencySession => {
  if (session.status !== 'countdown') return session

  const nextValue = Math.max(0, session.countdownRemaining - 1)
  if (nextValue === 0) {
    return {
      ...session,
      status: 'active',
      countdownRemaining: 0,
      satelliteMessages: ['Handshake complete with simulated satellite relay.'],
    }
  }

  return {
    ...session,
    countdownRemaining: nextValue,
  }
}

export const cancelCountdown = (session: EmergencySession): EmergencySession => ({
  ...session,
  status: 'resolved',
  countdownRemaining: 0,
})

export const appendSatelliteMessage = (session: EmergencySession, message: string): EmergencySession => ({
  ...session,
  satelliteMessages: [...session.satelliteMessages, message],
})

export const appendLocationPoint = (session: EmergencySession, point: string): EmergencySession => ({
  ...session,
  locationTrail: [...session.locationTrail, point],
})
