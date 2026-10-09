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
}).strict().superRefine((registration, context) => {
  if (!registration.invitationToken && !registration.workspaceName) {
    context.addIssue({ code: 'custom', path: ['workspaceName'], message: 'Informe o nome do primeiro ambiente.' });
  }
});

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
  recordedAt: z.string().datetime({ offset: true }).optional()
}).strict();

export const ingestionSchema = z.object({
  externalId: trimmed(128),
  name: trimmed(120),
  location: z.string().trim().max(200).nullable().optional(),
  status: z.enum(['online', 'offline', 'warning']).default('online'),
  readings: z.array(readingSchema).max(100).default([])
}).strict();

export type IngestionPayload = z.infer<typeof ingestionSchema>;
