import type { DeviceState, EmergencyContact, UserAccount, UserProfile } from '../types'

export const demoUsers: UserAccount[] = [
  {
    id: 'u-1',
    name: 'Anika Sharma',
    email: 'anika@shaktisos.app',
    password: 'user123',
    role: 'user',
  },
  {
    id: 'o-1',
    name: 'Riya Operator',
    email: 'operator@shaktisos.app',
    password: 'operator123',
    role: 'operator',
  },
]

export const defaultProfile: UserProfile = {
  userId: 'u-1',
  ageRange: '26-35',
  bloodGroup: 'B+',
  medicalNotes: 'No known severe allergies.',
  privacyMode: 'strict',
}

export const defaultContacts: EmergencyContact[] = [
  { id: 'c-1', name: 'Meera', phone: '+91-90000-11111', relation: 'Sister' },
  { id: 'c-2', name: 'Nisha', phone: '+91-90000-22222', relation: 'Friend' },
]

export const defaultDeviceState: DeviceState = {
  battery: 78,
  connectivity: 'online',
  gpsAccuracy: 'high',
}
