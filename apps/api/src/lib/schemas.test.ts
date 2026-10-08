import assert from 'node:assert/strict';
import test from 'node:test';
import {
  changePasswordSchema,
  deviceLinkLoginSchema,
  forgotPasswordSchema,
  ingestionSchema,
  loginSchema,
  resetPasswordSchema,
  updateProfileSchema
} from './schemas.js';

test('aceita um aparelho com leituras validas', () => {
  const result = ingestionSchema.safeParse({
    externalId: 'sensor-01',
    name: 'Sensor 01',
    status: 'online',
    readings: [{ type: 'temperatura', value: 22.5, unit: 'C', recordedAt: '2026-09-26T12:30:00.000Z' }]
  });
  assert.equal(result.success, true);
});

test('rejeita valores nao finitos e campos desconhecidos', () => {
  assert.equal(ingestionSchema.safeParse({ externalId: 's1', name: 'Sensor', value: Infinity }).success, false);
  assert.equal(ingestionSchema.safeParse({ externalId: 's1', name: 'Sensor', unexpected: true }).success, false);
});

test('rejeita credenciais malformadas', () => {
  assert.equal(loginSchema.safeParse({ email: 'nao-email', password: 'senha' }).success, false);
});

test('valida os dados de vinculo de um aparelho', () => {
  assert.equal(deviceLinkLoginSchema.safeParse({
    email: 'admin@laboratorio.local',
    password: 'senha-segura',
    externalId: 'aa:bb:cc:dd:ee:ff',
    name: 'Monitor LAB'
  }).success, true);
  assert.equal(deviceLinkLoginSchema.safeParse({
    email: 'invalido',
    password: 'senha',
    externalId: 'sensor-01',
    name: 'Monitor LAB'
  }).success, false);
});

test('valida perfil, troca de senha e recuperacao', () => {
  assert.equal(updateProfileSchema.safeParse({
    displayName: 'Pessoa Usuaria',
    email: 'pessoa@example.com',
    currentPassword: 'senha-atual',
    avatarDataUrl: null
  }).success, true);
  assert.equal(changePasswordSchema.safeParse({ currentPassword: 'senha-atual', newPassword: 'senha-nova-com-12' }).success, true);
  assert.equal(forgotPasswordSchema.safeParse({ email: 'pessoa@example.com' }).success, true);
  assert.equal(resetPasswordSchema.safeParse({ token: 'a'.repeat(32), password: 'senha-nova-com-12' }).success, true);
  assert.equal(changePasswordSchema.safeParse({ currentPassword: 'x', newPassword: 'curta' }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ token: 'curto', password: 'senha-nova-com-12' }).success, false);
});
