export const LEGACY_DEMO_SENSOR_EXTERNAL_ID = 'e2e-windows-sensor-01';
export const DEMO_SENSOR_PREFIX = 'demo-sensor';

export function buildDemoSensorExternalId(userId: string, workspaceId?: string): string {
  return workspaceId
    ? `${DEMO_SENSOR_PREFIX}-${userId}-${workspaceId}`
    : `${DEMO_SENSOR_PREFIX}-${userId}`;
}
export function resolveDemoSensorWorkspaceId(currentWorkspaceId: string | null, ownedWorkspaceId: string | null): string | null {
  return currentWorkspaceId && currentWorkspaceId === ownedWorkspaceId ? currentWorkspaceId : null;
}

export function isDemoSensorExternalId(externalId: string | null | undefined): boolean {
  if (!externalId) return false;
  return externalId === LEGACY_DEMO_SENSOR_EXTERNAL_ID || externalId.startsWith(`${DEMO_SENSOR_PREFIX}-`);
}

export function canUseDemoSensorForUser(input: {
  userId?: string;
  email?: string;
  isPlatformAdmin: boolean;
  isBootstrapAdmin: boolean;
  demoSensorEnabled: boolean;
  demoSensorAdminOnly: boolean;
}): boolean {
  if (!input.demoSensorEnabled) return false;
  if (!input.demoSensorAdminOnly) return true;
  return input.isPlatformAdmin || input.isBootstrapAdmin;
}

export function canViewDemoSensorForUser(input: {
  ownerUserId: string | null;
  userId: string;
  isPlatformAdmin: boolean;
  isBootstrapAdmin: boolean;
  demoSensorEnabled: boolean;
  demoSensorAdminOnly: boolean;
}): boolean {
  return input.ownerUserId === input.userId && canUseDemoSensorForUser(input);
}
