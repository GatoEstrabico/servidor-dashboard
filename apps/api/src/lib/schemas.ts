import { z } from 'zod';

const trimmed = (max: number) => z.string().trim().min(1).max(max);
const workspaceName = z.string().trim().min(2).max(80);
const workspaceIconSchema = z.string().max(350_000).regex(/^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/).nullable();
const phoneNumber = z.preprocess(
  (value) => typeof value === 'string' ? value.trim().replace(/[()\s-]/g, '') || null : value,
  z.string().regex(/^\+[1-9]\d{7,14}$/).nullable()
);

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
}).strict();

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254)
}).strict();

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(12).max(128)
}).strict();

export const registrationSchema = z.object({
  email: z.string().trim().email().max(254),
  displayName: trimmed(80),
  password: z.string().min(12).max(128),
  workspaceName: z.string().trim().min(2).max(80).optional(),
  invitationToken: z.string().min(32).max(128).optional()
}).strict();

export const tokenSchema = z.object({ token: z.string().min(32).max(128) }).strict();
export const createWorkspaceSchema = z.object({
  name: workspaceName,
  iconDataUrl: workspaceIconSchema.optional()
}).strict();
export const updateWorkspaceSchema = z.object({
  name: workspaceName,
  iconDataUrl: workspaceIconSchema
}).strict();
export const joinWorkspaceSchema = z.object({
  code: z.string().trim().min(4).max(20).refine((value) => /^[A-Z0-9-]+$/i.test(value), 'Código inválido.')
}).strict();
export const activeWorkspaceSchema = z.object({ workspaceId: trimmed(64) }).strict();
export const assignWorkspaceDeviceSchema = z.object({ deviceId: trimmed(64) }).strict();
export const inviteWorkspaceMemberSchema = z.object({
  email: z.string().trim().email().max(254),
  role: z.enum(['admin', 'member']).default('member')
}).strict();
export const updateWorkspaceMemberSchema = z.object({
  userId: trimmed(64),
  role: z.enum(['admin', 'member'])
}).strict();
export const registrationSettingSchema = z.object({ enabled: z.boolean() }).strict();
const whatsappMessageTemplate = z.string().trim().min(1).max(500).refine((message) => {
  const validPlaceholders = new Set(['laboratorio', 'aparelho', 'status', 'localizacao', 'identificador']);
  const placeholders = message.match(/\{\{[^{}]+\}\}/g) ?? [];
  return placeholders.every((placeholder) => validPlaceholders.has(placeholder.slice(2, -2)));
}, 'A mensagem contém um campo desconhecido.');
export const whatsappNotificationSettingsSchema = z.object({
  senderName: trimmed(80),
  onlineMessage: whatsappMessageTemplate,
  warningMessage: whatsappMessageTemplate,
  offlineMessage: whatsappMessageTemplate,
  onlineMediaType: z.enum(['none', 'sticker', 'image']).default('sticker'),
  warningMediaType: z.enum(['none', 'sticker', 'image']).default('sticker'),
  offlineMediaType: z.enum(['none', 'sticker', 'image']).default('sticker'),
  onlineMediaId: z.string().max(64).regex(/^[A-Za-z0-9_-]+$/).nullable().default('default-success'),
  warningMediaId: z.string().max(64).regex(/^[A-Za-z0-9_-]+$/).nullable().default('default-alert'),
  offlineMediaId: z.string().max(64).regex(/^[A-Za-z0-9_-]+$/).nullable().default('default-alert')
}).strict().refine((settings) => {
  const validSelection = (type: 'none' | 'sticker' | 'image', mediaId: string | null) => type === 'none' ? mediaId === null : Boolean(mediaId);
  return validSelection(settings.onlineMediaType, settings.onlineMediaId)
    && validSelection(settings.warningMediaType, settings.warningMediaId)
    && validSelection(settings.offlineMediaType, settings.offlineMediaId);
}, 'Selecione uma mídia favorita para cada alerta ou escolha somente texto.');
export const whatsappFavoriteMediaSchema = z.object({
  name: z.string().trim().min(1).max(48),
  mediaDataUrl: z.string().max(1_400_000).regex(/^data:image\/(webp|gif|png|jpeg);base64,[A-Za-z0-9+/]+=*$/)
}).strict();

export const whatsappCloudSettingsSchema = z.object({
  connectionMode: z.enum(['qr', 'cloud']),
  accessToken: z.string().trim().max(4096),
  clearAccessToken: z.boolean(),
  phoneNumberId: z.string().trim().max(64).regex(/^\d*$/),
  apiVersion: z.string().regex(/^v\d+\.\d+$/),
  templateName: z.string().trim().min(1).max(128).regex(/^[a-z0-9_]+$/),
  templateLanguage: z.string().regex(/^[a-z]{2}_[A-Z]{2}$/)
}).strict().refine((settings) => !(settings.clearAccessToken && settings.accessToken), {
  path: ['clearAccessToken'],
  message: 'Não envie um token ao mesmo tempo que solicita sua remoção.'
});
export const whatsappProfileUpdateSchema = z.object({
  name: trimmed(80),
  photoDataUrl: z.string().max(450_000).regex(/^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/).nullable()
}).strict();
export const whatsappProfileRestoreSchema = z.object({ snapshotId: trimmed(64) }).strict();
const whatsappPrivacyValue = z.enum(['all', 'contacts', 'contact_blacklist', 'none']);
export const whatsappPrivacySettingsSchema = z.object({
  lastSeen: whatsappPrivacyValue,
  online: z.enum(['all', 'match_last_seen']),
  profilePhoto: whatsappPrivacyValue,
  status: whatsappPrivacyValue,
  readReceipts: z.enum(['all', 'none']),
  groupsAdd: z.enum(['all', 'contacts', 'contact_blacklist'])
}).strict();
export const emailNotificationSettingsSchema = z.object({
  smtpHost: trimmed(255),
  smtpPort: z.number().int().min(1).max(65535),
  smtpSecure: z.boolean(),
  smtpUser: z.string().trim().min(1).max(254),
  smtpPassword: z.string().max(512).optional(),
  clearSmtpPassword: z.boolean().default(false),
  senderName: trimmed(80),
  senderEmail: z.string().trim().email().max(254),
  onlineMessage: whatsappMessageTemplate,
  warningMessage: whatsappMessageTemplate,
  offlineMessage: whatsappMessageTemplate
}).strict();

export const updateProfileSchema = z.object({
  displayName: trimmed(80),
  email: z.string().trim().email().max(254),
  currentPassword: z.string().min(1).max(128),
  avatarDataUrl: z.string().max(350_000).regex(/^data:image\/(png|jpeg|webp);base64,/).nullable(),
  whatsappNumber: phoneNumber.default(null),
  emailNotifications: z.boolean().default(true),
  whatsappNotifications: z.boolean().default(false)
}).strict().superRefine((profile, context) => {
  if (profile.whatsappNotifications && !profile.whatsappNumber) {
    context.addIssue({
      code: 'custom',
      path: ['whatsappNumber'],
      message: 'Informe um número de WhatsApp para ativar as notificações.'
    });
  }
});

export const workspaceNotificationPreferencesSchema = z.object({
  notifyAllDevices: z.boolean(),
  devices: z.array(z.object({
    deviceId: trimmed(64),
    emailEnabled: z.boolean(),
    whatsappEnabled: z.boolean()
  }).strict()).max(250)
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128)
}).strict();

export const deviceLinkLoginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
  workspaceId: z.string().trim().min(1).max(64).optional(),
  externalId: trimmed(128),
  name: trimmed(120),
  location: z.string().trim().max(200).nullable().optional()
}).strict();

export const deviceLinkWorkspacesSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
}).strict();

export const readingSchema = z.object({
  type: trimmed(64),
  value: z.number().finite().min(-1_000_000_000).max(1_000_000_000),
  unit: trimmed(24),
  alert: z.boolean().default(false),
  recordedAt: z.string().datetime({ offset: true }).optional()
}).strict();

export const ingestionSchema = z.object({
  externalId: trimmed(128),
  name: trimmed(120),
  location: z.string().trim().max(200).nullable().optional(),
  status: z.enum(['online', 'offline', 'warning']).default('online'),
  readings: z.array(readingSchema).max(100).default([])
}).strict();

export const simulateDemoDeviceSchema = z.object({
  status: z.enum(['online', 'warning', 'offline']),
  temperature: z.number().finite().min(-50).max(150),
  humidity: z.number().finite().min(0).max(100),
  gas: z.number().finite().min(0).max(100_000)
}).strict();

export const updateDeviceAliasSchema = z.object({
  alias: z.preprocess((value) => typeof value === 'string' && !value.trim() ? null : value, z.string().trim().max(80).nullable())
}).strict();

export type IngestionPayload = z.infer<typeof ingestionSchema>;
