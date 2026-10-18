export type Role = 'user' | 'operator'

export interface UserAccount {
  id: string
  name: string
  email: string
  password: string
  role: Role
}

export interface UserProfile {
  userId: string
  ageRange: string
  bloodGroup: string
  medicalNotes: string
  privacyMode: 'strict' | 'standard'
}

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  relation: string
}

export interface DeviceState {
  battery: number
  connectivity: 'online' | 'limited' | 'offline'
  gpsAccuracy: 'high' | 'medium' | 'low'
}

export interface AuditEvent {
  id: string
  timestamp: string
  actor: string
  action: string
  metadata?: string
}

export interface EmergencySession {
  id: string
  userId: string
  startedAt: string
  status: 'countdown' | 'active' | 'resolved'
  countdownRemaining: number
  satelliteMessages: string[]
  locationTrail: string[]
}
