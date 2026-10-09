import assert from 'node:assert/strict';
import test from 'node:test';
import {
  changePasswordSchema,
  assignWorkspaceDeviceSchema,
  createWorkspaceSchema,
  deviceLinkLoginSchema,
  deviceLinkWorkspacesSchema,
  forgotPasswordSchema,
  ingestionSchema,
  inviteWorkspaceMemberSchema,
  joinWorkspaceSchema,
  loginSchema,
  registrationSchema,
  registrationSettingSchema,
  resetPasswordSchema,
  tokenSchema,
  updateWorkspaceMemberSchema,
  updateWorkspaceSchema,
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

test('valida cadastro público, convite e ativação por e-mail', () => {
  const registration = { email: 'nova@example.com', displayName: 'Nova Pessoa', password: 'senha-segura-123' };
  assert.equal(registrationSchema.safeParse({ ...registration, workspaceName: 'Meu laboratório' }).success, true);
  assert.equal(registrationSchema.safeParse({ ...registration, invitationToken: 'i'.repeat(32) }).success, true);
  assert.equal(registrationSchema.safeParse(registration).success, false);
  assert.equal(registrationSchema.safeParse({ ...registration, password: 'curta', workspaceName: 'Lab' }).success, false);
  assert.equal(tokenSchema.safeParse({ token: 'v'.repeat(32) }).success, true);
});

test('valida ambientes, convites e politica de cadastro', () => {
  assert.equal(createWorkspaceSchema.safeParse({ name: 'Laboratório 2' }).success, true);
  assert.equal(createWorkspaceSchema.safeParse({ name: 'Laboratório 2', iconDataUrl: null }).success, true);
  assert.equal(updateWorkspaceSchema.safeParse({ name: 'Laboratório 2', iconDataUrl: null }).success, true);
  assert.equal(updateWorkspaceSchema.safeParse({ name: 'L', iconDataUrl: null }).success, false);
  assert.equal(updateWorkspaceSchema.safeParse({ name: 'Laboratório 2', iconDataUrl: 'https://example.com/icon.png' }).success, false);
  assert.equal(assignWorkspaceDeviceSchema.safeParse({ deviceId: 'device_1' }).success, true);
  assert.equal(assignWorkspaceDeviceSchema.safeParse({ deviceId: '' }).success, false);
  assert.equal(joinWorkspaceSchema.safeParse({ code: 'LAB-AB12CD' }).success, true);
  assert.equal(joinWorkspaceSchema.safeParse({ code: 'lab-ab12cd' }).success, true);
  assert.equal(joinWorkspaceSchema.safeParse({ code: 'abc' }).success, false);
  assert.equal(inviteWorkspaceMemberSchema.safeParse({ email: 'membro@example.com' }).success, true);
  assert.equal(updateWorkspaceMemberSchema.safeParse({ userId: 'usr_1', role: 'admin' }).success, true);
  assert.equal(registrationSettingSchema.safeParse({ enabled: false }).success, true);
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

test('valida autenticacao para listar ambientes disponiveis ao ESP32', () => {
  assert.equal(deviceLinkWorkspacesSchema.safeParse({ email: 'admin@example.com', password: 'senha' }).success, true);
  assert.equal(deviceLinkWorkspacesSchema.safeParse({ email: 'invalido', password: 'senha' }).success, false);
});

test('valida perfil, troca de senha e recuperacao', () => {
  assert.equal(updateProfileSchema.safeParse({
    displayName: 'Pessoa Usuaria',
    email: 'pessoa@example.com',
    currentPassword: 'senha-atual',
    avatarDataUrl: null,
    whatsappNumber: '+55 (21) 99999-9999',
    emailNotifications: true,
    whatsappNotifications: true
  }).success, true);
  assert.equal(updateProfileSchema.safeParse({
    displayName: 'Pessoa Usuaria',
    email: 'pessoa@example.com',
    currentPassword: 'senha-atual',
    avatarDataUrl: null,
    whatsappNumber: '21999999999',
    emailNotifications: true,
    whatsappNotifications: true
  }).success, false);
  assert.equal(updateProfileSchema.safeParse({
    displayName: 'Pessoa Usuaria',
    email: 'pessoa@example.com',
    currentPassword: 'senha-atual',
    avatarDataUrl: null,
    whatsappNumber: null,
    emailNotifications: true,
    whatsappNotifications: true
  }).success, false);
  assert.equal(changePasswordSchema.safeParse({ currentPassword: 'senha-atual', newPassword: 'senha-nova-com-12' }).success, true);
  assert.equal(forgotPasswordSchema.safeParse({ email: 'pessoa@example.com' }).success, true);
  assert.equal(resetPasswordSchema.safeParse({ token: 'a'.repeat(32), password: 'senha-nova-com-12' }).success, true);
  assert.equal(changePasswordSchema.safeParse({ currentPassword: 'x', newPassword: 'curta' }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ token: 'curto', password: 'senha-nova-com-12' }).success, false);
});
