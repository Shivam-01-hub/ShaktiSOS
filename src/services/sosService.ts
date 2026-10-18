import { acknowledgeAlert, createAlert, notifyContacts, resolveAlert, sendSatelliteMessageSimulation } from './notificationService';
import type { Device, LocationPoint, SOSAlert } from '../types';

export function demoLocation(): LocationPoint {
  return { latitude: 28.6139, longitude: 77.209, timestamp: new Date().toISOString() };
}

export function createDemoAlert(userId: string, device: Device, location = demoLocation()): SOSAlert {
  const now = new Date().toISOString();
  const base: SOSAlert = {
    id: `SOS-${Date.now().toString(36).toUpperCase()}`,
    userId,
    status: 'RECEIVED',
    location,
    createdAt: now,
    lastUpdatedAt: now,
    batteryLevel: device.batteryLevel,
    signalStrength: device.signalStrength,
    contactNotification: 'Pending',
    satelliteTransmission: 'Pending',
    locationHistory: [location],
    auditHistory: [{ id: crypto.randomUUID(), alertId: '', action: 'SOS created', timestamp: now }],
    evidence: [],
  };
  base.auditHistory[0].alertId = base.id;
  const alert = createAlert(base);
  return {
    ...alert,
    contactNotification: notifyContacts(alert).status,
    satelliteTransmission: sendSatelliteMessageSimulation(alert).status,
    auditHistory: [
      ...alert.auditHistory,
      { id: crypto.randomUUID(), alertId: alert.id, action: 'Trusted contacts notified', timestamp: now },
      { id: crypto.randomUUID(), alertId: alert.id, action: 'Satellite simulation sent', timestamp: now },
    ],
  };
}

export function appendSimulatedLocation(alert: SOSAlert, location = demoLocation()): SOSAlert {
  return {
    ...alert,
    location,
    lastUpdatedAt: location.timestamp,
    locationHistory: [...alert.locationHistory, location],
    auditHistory: [...alert.auditHistory, { id: crypto.randomUUID(), alertId: alert.id, action: 'Location update', timestamp: location.timestamp }],
  };
}

export { acknowledgeAlert, resolveAlert };
