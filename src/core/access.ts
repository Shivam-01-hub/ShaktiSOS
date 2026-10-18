import type { Role } from '../types'

const rolePermissions: Record<Role, string[]> = {
  user: ['profile:read', 'profile:update', 'contacts:manage', 'sos:trigger', 'audit:read:own'],
  operator: ['dashboard:read', 'emergency:monitor', 'audit:read:all'],
}

export const hasPermission = (role: Role, permission: string): boolean =>
  rolePermissions[role].includes(permission)
