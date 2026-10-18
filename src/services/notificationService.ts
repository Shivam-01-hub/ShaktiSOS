import type { DeliveryStatus, SOSAlert } from '../types';

export interface NotificationResult {
  status: DeliveryStatus;
  message: string;
}

export function createAlert(alert: SOSAlert): SOSAlert {
  return { ...alert, status: 'RECEIVED' };
}

export function notifyContacts(alert: SOSAlert): NotificationResult {
  if (alert.signalStrength === 'Unavailable') return { status: 'Failed', message: 'Contacts could not be reached while offline.' };
  return { status: 'Delivered', message: 'Trusted contacts notified in the demo.' };
}

export function sendSatelliteMessageSimulation(alert: SOSAlert): NotificationResult {
  if (alert.batteryLevel < 10 || alert.signalStrength === 'Unavailable') {
    return { status: 'Failed', message: 'Transmission failed: check battery and signal.' };
  }
  if (alert.signalStrength === 'Weak') return { status: 'Pending', message: 'Transmission pending due to weak signal.' };
  return { status: 'Delivered', message: 'SIMULATED SATELLITE TRANSMISSION delivered.' };
}

export function acknowledgeAlert(alert: SOSAlert): SOSAlert {
  return { ...alert, status: 'ACKNOWLEDGED' };
}

export function resolveAlert(alert: SOSAlert): SOSAlert {
  return { ...alert, status: 'RESOLVED' };
}
