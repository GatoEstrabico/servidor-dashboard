import test from 'node:test';
import assert from 'node:assert/strict';

import { toAccountProfile } from './account-user.js';

test('toAccountProfile preserves admin metadata for the session cache', () => {
  const user = toAccountProfile({
    id: 'user-1',
    email: 'admin@lab.test',
    displayName: 'Admin',
    avatarDataUrl: null,
    whatsappNumber: '+5511999999999',
    emailNotifications: true,
    whatsappNotifications: false,
    emailVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
    isPlatformAdmin: false,
    isBootstrapAdmin: true
  });

  assert.equal(user.isPlatformAdmin, true);
  assert.equal(user.isBootstrapAdmin, true);
  assert.equal(user.email, 'admin@lab.test');
  assert.equal(user.whatsappNumber, '+5511999999999');
});
