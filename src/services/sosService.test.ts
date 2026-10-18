import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appendSimulatedLocation, createDemoAlert } from './sosService';
import { notifyContacts, resolveAlert, sendSatelliteMessageSimulation } from './notificationService';
import { createEvidence, progressEvidence } from './evidenceService';
import { maskAadhaar, registerUser, resetDemoData, storage } from './storage';
import type { Device } from '../types';

const device: Device = { id: 'demo', name: 'Beacon', batteryLevel: 80, signalStrength: 'Strong', pairingStatus: 'Paired', firmwareVersion: 'demo' };

describe('ShaktiSOS emergency workflow', () => {
  beforeEach(() => { vi.stubGlobal('crypto', { randomUUID: () => 'test-id', subtle: globalThis.crypto.subtle }); resetDemoData(); });

  it('creates an alert and notifies contacts', () => {
    const alert = createDemoAlert('user-1', device);
    expect(alert.status).toBe('RECEIVED');
    expect(alert.contactNotification).toBe('Delivered');
    expect(alert.satelliteTransmission).toBe('Delivered');
    expect(alert.auditHistory.map((entry) => entry.action)).toContain('SOS created');
  });

  it('appends a simulated location update', () => {
    const alert = createDemoAlert('user-1', device);
    const updated = appendSimulatedLocation(alert, { latitude: 28.62, longitude: 77.21, timestamp: '2026-01-01T00:00:00.000Z' });
    expect(updated.locationHistory).toHaveLength(2);
    expect(updated.location.latitude).toBe(28.62);
    expect(updated.auditHistory.at(-1)?.action).toBe('Location update');
  });

  it('handles weak signal and low battery safely', () => {
    const weak = { ...device, signalStrength: 'Weak' as const };
    const weakAlert = createDemoAlert('user-1', weak);
    expect(weakAlert.satelliteTransmission).toBe('Pending');
    expect(notifyContacts({ ...weakAlert, signalStrength: 'Unavailable' })).toMatchObject({ status: 'Failed' });
    expect(sendSatelliteMessageSimulation({ ...weakAlert, batteryLevel: 5 })).toMatchObject({ status: 'Failed' });
  });

  it('resolves an emergency', () => {
    const alert = createDemoAlert('user-1', device);
    expect(resolveAlert(alert).status).toBe('RESOLVED');
  });

  it('supports simulated evidence recording and upload states', () => {
    const alert = createDemoAlert('user-1', device);
    const recording = createEvidence(alert, 'Video');
    expect(recording).toMatchObject({ kind: 'Video', status: 'Recording', simulated: true });
    expect(progressEvidence(recording, 'Uploading').status).toBe('Uploading');
    expect(progressEvidence(recording, 'Uploaded').status).toBe('Uploaded');
  });

  it('validates and protects registration identity data', async () => {
    expect(maskAadhaar('123456789012')).toBe('XXXX-XXXX-9012');
    const user = await registerUser({
      fullName: 'Test User',
      mobileNumber: '+91 90000 00000',
      email: 'test-registration@example.com',
      password: 'demo123',
      dateOfBirth: '1995-01-01',
      address: 'Demo address',
      aadhaarNumber: '123456789012',
      emergencyContactName: 'Trusted Person',
      emergencyContactPhone: '+91 91111 11111',
      emergencyContactRelationship: 'Friend',
    });
    expect(user?.verificationStatus).toBe('Pending Verification');
    const identity = storage.identities().find((item) => item.userId === user?.id);
    expect(identity?.aadhaarMasked).toBe('XXXX-XXXX-9012');
    expect(identity?.aadhaarHash).not.toContain('123456789012');
  });
});
