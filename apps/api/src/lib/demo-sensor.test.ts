import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDemoSensorExternalId, canUseDemoSensorForUser, canViewDemoSensorForUser, isDemoSensorExternalId, LEGACY_DEMO_SENSOR_EXTERNAL_ID, resolveDemoSensorWorkspaceId } from './demo-sensor.js';

test('builds a unique demo sensor id per user', () => {
  assert.equal(buildDemoSensorExternalId('user-123'), 'demo-sensor-user-123');
  assert.notEqual(buildDemoSensorExternalId('user-123'), buildDemoSensorExternalId('user-456'));
});

test('keeps one stable demo sensor id per account', () => {
  assert.equal(buildDemoSensorExternalId('user-123'), buildDemoSensorExternalId('user-123'));
});

test('recognizes legacy and generated demo sensor ids', () => {
  assert.equal(isDemoSensorExternalId(LEGACY_DEMO_SENSOR_EXTERNAL_ID), true);
  assert.equal(isDemoSensorExternalId('demo-sensor-user-123'), true);
  assert.equal(isDemoSensorExternalId('demo-sensor-user-123-workspace-a'), true);
  assert.equal(isDemoSensorExternalId('sensor-real-001'), false);
});

test('allows non-admin users to use the demo sensor by default', () => {
  assert.equal(canUseDemoSensorForUser({
    userId: 'user-123',
    email: 'user@lab.test',
    isPlatformAdmin: false,
    isBootstrapAdmin: false,
    demoSensorEnabled: true,
    demoSensorAdminOnly: false
  }), true);
});

test('blocks non-admin users when demo sensor is admin-only', () => {
  assert.equal(canUseDemoSensorForUser({
    userId: 'user-123',
    email: 'user@lab.test',
    isPlatformAdmin: false,
    isBootstrapAdmin: false,
    demoSensorEnabled: true,
    demoSensorAdminOnly: true
  }), false);
});

test('allows admins to keep using the demo sensor in admin-only mode', () => {
  assert.equal(canUseDemoSensorForUser({
    userId: 'admin-1',
    email: 'admin@lab.test',
    isPlatformAdmin: true,
    isBootstrapAdmin: false,
    demoSensorEnabled: true,
    demoSensorAdminOnly: true
  }), true);
});

test('only shows a demo sensor to its owner', () => {
  const settings = { isPlatformAdmin: false, isBootstrapAdmin: false, demoSensorEnabled: true, demoSensorAdminOnly: false };
  assert.equal(canViewDemoSensorForUser({ ...settings, ownerUserId: 'owner-1', userId: 'owner-1' }), true);
  assert.equal(canViewDemoSensorForUser({ ...settings, ownerUserId: 'owner-1', userId: 'member-1' }), false);
});
test('does not reassign an unassigned demo sensor after removal', () => {
  assert.equal(resolveDemoSensorWorkspaceId(null, 'owned-workspace'), null);
  assert.equal(resolveDemoSensorWorkspaceId('shared-workspace', 'owned-workspace'), null);
  assert.equal(resolveDemoSensorWorkspaceId('owned-workspace', 'owned-workspace'), 'owned-workspace');
});
