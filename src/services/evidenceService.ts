import type { EmergencyEvidence, EvidenceKind, EvidenceStatus, SOSAlert } from '../types';

export function createEvidence(alert: SOSAlert, kind: EvidenceKind): EmergencyEvidence {
  const timestamp = new Date().toISOString();
  return {
    id: `evidence-${Date.now().toString(36)}`,
    alertId: alert.id,
    kind,
    status: 'Recording',
    createdAt: timestamp,
    fileName: `${alert.id}-${kind.toLowerCase()}-${Date.now()}.demo`,
    simulated: true,
  };
}

export function progressEvidence(evidence: EmergencyEvidence, status: EvidenceStatus): EmergencyEvidence {
  return { ...evidence, status };
}

export async function requestCameraPermission(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}
