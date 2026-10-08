import { z } from 'zod';

const trimmed = (max: number) => z.string().trim().min(1).max(max);

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

export const updateProfileSchema = z.object({
  displayName: trimmed(80),
  email: z.string().trim().email().max(254),
  currentPassword: z.string().min(1).max(128),
  avatarDataUrl: z.string().max(350_000).regex(/^data:image\/(png|jpeg|webp);base64,/).nullable()
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128)
}).strict();

export const deviceLinkLoginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
  externalId: trimmed(128),
  name: trimmed(120),
  location: z.string().trim().max(200).nullable().optional()
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
