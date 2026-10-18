import type { Device, EmergencyContact, MisuseEvent, SOSAlert, User } from '../types';

const keys = {
  users: 'shaktisos-users',
  contacts: 'shaktisos-contacts',
  device: 'shaktisos-device',
  alerts: 'shaktisos-alerts',
  session: 'shaktisos-session',
  misuse: 'shaktisos-misuse',
};

const demoUsers: User[] = [
  { id: 'user-1', name: 'Aarohi Sharma', email: 'user@shaktisos.demo', password: 'demo123', role: 'user' },
  { id: 'operator-1', name: 'Response Operator', email: 'operator@shaktisos.demo', password: 'demo123', role: 'operator' },
];

const defaultContacts: EmergencyContact[] = [
  { id: 'contact-1', userId: 'user-1', name: 'Maya Sharma', phone: '+91 98765 43210', relationship: 'Sister', email: 'maya@example.com' },
  { id: 'contact-2', userId: 'user-1', name: 'Riya Mehta', phone: '+91 98765 12345', relationship: 'Friend' },
];

const defaultDevice: Device = {
  id: 'SAT-DEMO-042',
  name: 'Shakti Beacon',
  batteryLevel: 87,
  signalStrength: 'Strong',
  pairingStatus: 'Paired',
  firmwareVersion: 'v0.9.4-demo',
};

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function seedDemoData(): void {
  if (!localStorage.getItem(keys.users)) write(keys.users, demoUsers);
  if (!localStorage.getItem(keys.contacts)) write(keys.contacts, defaultContacts);
  if (!localStorage.getItem(keys.device)) write(keys.device, defaultDevice);
  if (!localStorage.getItem(keys.alerts)) write<SOSAlert[]>(keys.alerts, []);
  if (!localStorage.getItem(keys.misuse)) write<MisuseEvent[]>(keys.misuse, []);
}

export const storage = {
  users: () => read<User[]>(keys.users, demoUsers),
  saveUsers: (users: User[]) => write(keys.users, users),
  contacts: () => read<EmergencyContact[]>(keys.contacts, defaultContacts),
  saveContacts: (contacts: EmergencyContact[]) => write(keys.contacts, contacts),
  device: () => read<Device>(keys.device, defaultDevice),
  saveDevice: (device: Device) => write(keys.device, device),
  alerts: () => read<SOSAlert[]>(keys.alerts, []).map((alert) => ({ ...alert, evidence: alert.evidence ?? [] })),
  saveAlerts: (alerts: SOSAlert[]) => write(keys.alerts, alerts),
  misuse: () => read<MisuseEvent[]>(keys.misuse, []),
  saveMisuse: (events: MisuseEvent[]) => write(keys.misuse, events),
  session: () => read<User | null>(keys.session, null),
  saveSession: (user: User | null) => user ? write(keys.session, user) : localStorage.removeItem(keys.session),
};

export function authenticate(email: string, password: string): User | null {
  return storage.users().find((user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password) ?? null;
}

export function registerUser(name: string, email: string, password: string): User | null {
  const users = storage.users();
  if (users.some((user) => user.email.toLowerCase() === email.trim().toLowerCase())) return null;
  const user: User = { id: `user-${Date.now()}`, name: name.trim(), email: email.trim(), password, role: 'user' };
  storage.saveUsers([...users, user]);
  return user;
}

export function resetDemoData(): void {
  Object.values(keys).forEach((key) => localStorage.removeItem(key));
  seedDemoData();
}
