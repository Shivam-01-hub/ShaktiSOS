export type Role = 'user' | 'trusted-contact' | 'operator' | 'admin';
export type VerificationStatus = 'Pending Verification' | 'Verified' | 'Rejected';
export type AlertStatus = 'RECEIVED' | 'ACKNOWLEDGED' | 'ASSISTANCE DISPATCHED' | 'RESOLVED';
export type DeliveryStatus = 'Pending' | 'Delivered' | 'Failed';
export type SignalStrength = 'Strong' | 'Medium' | 'Weak' | 'Unavailable';
export type EvidenceStatus = 'Recording' | 'Uploading' | 'Uploaded' | 'Failed';
export type EvidenceKind = 'Photo' | 'Video';
export type AlertClassification = 'Genuine Emergency' | 'Accidental Trigger' | 'False Alert / Misuse';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  verificationStatus: VerificationStatus;
}

export interface IdentityVerification {
  id: string;
  userId: string;
  fullName: string;
  mobileNumber: string;
  dateOfBirth: string;
  address: string;
  aadhaarHash: string;
  aadhaarMasked: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  consentedAt: string;
  status: VerificationStatus;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string;
  email?: string;
}

export interface Device {
  id: string;
  name: string;
  batteryLevel: number;
  signalStrength: SignalStrength;
  pairingStatus: 'Paired' | 'Not paired';
  firmwareVersion: string;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  alertId: string;
  action: string;
  timestamp: string;
}

export interface EmergencyEvidence {
  id: string;
  alertId: string;
  kind: EvidenceKind;
  status: EvidenceStatus;
  createdAt: string;
  fileName: string;
  simulated: boolean;
}

export interface MisuseEvent {
  id: string;
  userId: string;
  alertId?: string;
  kind: 'Accidental Trigger' | 'False Alert / Misuse';
  action: string;
  timestamp: string;
}

export interface SOSAlert {
  id: string;
  userId: string;
  status: AlertStatus;
  location: LocationPoint;
  createdAt: string;
  lastUpdatedAt: string;
  batteryLevel: number;
  signalStrength: SignalStrength;
  contactNotification: DeliveryStatus;
  satelliteTransmission: DeliveryStatus;
  locationHistory: LocationPoint[];
  auditHistory: AuditLog[];
  evidence: EmergencyEvidence[];
  classification?: AlertClassification;
}
