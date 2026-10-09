import dotenv from 'dotenv';
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import argon2 from 'argon2';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from './lib/prisma.js';
import {
  assignWorkspaceDeviceSchema,
  activeWorkspaceSchema,
  changePasswordSchema,
  createWorkspaceSchema,
  deviceLinkLoginSchema,
  forgotPasswordSchema,
  ingestionSchema,
  inviteWorkspaceMemberSchema,
  joinWorkspaceSchema,
  loginSchema,
  registrationSchema,
  registrationSettingSchema,
  resetPasswordSchema,
  simulateDemoDeviceSchema,
  tokenSchema,
  deviceLinkWorkspacesSchema,
  emailNotificationSettingsSchema,
  whatsappNotificationSettingsSchema,
  updateProfileSchema,
  updateWorkspaceSchema,
  updateWorkspaceMemberSchema
} from './lib/schemas.js';
import {
  clearWhatsAppWebLogs,
  closeWhatsAppWebSocket,
  connectWhatsAppWeb,
  disconnectWhatsAppWeb,
  formatWhatsAppNotificationMessage,
  getWhatsAppNotificationSettings,
  getWhatsAppWebLogs,
  getWhatsAppWebStatus,
  resumeWhatsAppWebSession,
  saveWhatsAppNotificationSettings,
  sendWhatsAppWebMessage
} from './lib/whatsapp-web.js';
import {
  clearEmailNotificationLogs,
  defaultEmailNotificationMessages,
  getEmailNotificationLogs,
  getEmailNotificationSettings,
  initializeEmailService,
  saveEmailNotificationSettings,
  sendEmailMessage,
  verifyEmailConnection
} from './lib/email-service.js';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DASHBOARD_ORIGIN: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  INGESTION_API_KEY: z.string().min(32),
  COOKIE_SECURE: z.enum(['true', 'false']).default('true'),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(12).optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(1).max(254).optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_API_VERSION: z.string().regex(/^v\d+\.\d+$/).default('v23.0'),
  WHATSAPP_TEMPLATE_NAME: z.string().regex(/^[a-z0-9_]+$/).default('lab_monitor_alarm'),
  WHATSAPP_TEMPLATE_LANGUAGE: z.string().regex(/^[a-z]{2}_[A-Z]{2}$/).default('pt_BR')
}).superRefine((value, context) => {
  if (Boolean(value.BOOTSTRAP_ADMIN_EMAIL) !== Boolean(value.BOOTSTRAP_ADMIN_PASSWORD)) {
    context.addIssue({
      code: 'custom',
      path: ['BOOTSTRAP_ADMIN_PASSWORD'],
      message: 'Configure BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD juntos.'
    });
  }
  if (Boolean(value.WHATSAPP_ACCESS_TOKEN) !== Boolean(value.WHATSAPP_PHONE_NUMBER_ID)) {
    context.addIssue({
      code: 'custom',
      path: ['WHATSAPP_PHONE_NUMBER_ID'],
      message: 'Configure WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID juntos.'
    });
  }
});
const env = envSchema.parse(process.env);
const parsedSmtpFrom = env.SMTP_FROM?.match(/^(.*?)\s*<([^<>]+)>$/);
await initializeEmailService({
  smtpHost: env.SMTP_HOST ?? '',
  smtpPort: env.SMTP_PORT,
  smtpSecure: env.SMTP_SECURE === 'true',
  smtpUser: env.SMTP_USER ?? '',
  smtpPassword: env.SMTP_PASSWORD ?? '',
  senderName: parsedSmtpFrom?.[1].replace(/^"|"$/g, '').trim() || 'LAB/MONITOR',
  senderEmail: parsedSmtpFrom?.[2] ?? env.SMTP_FROM?.trim() ?? '',
  ...defaultEmailNotificationMessages
}, env.SESSION_SECRET);
const bootstrapAdminEmail = env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const app = Fastify({ logger: true, bodyLimit: 512 * 1024 });
const cookieName = env.COOKIE_SECURE === 'true' ? '__Host-monitor_session' : 'monitor_session';
const sessionDurationMs = 12 * 60 * 60 * 1000;
const secureCookie = env.COOKIE_SECURE === 'true';
const simulatedDeviceExternalId = 'e2e-windows-sensor-01';
const dummyPasswordHash = await argon2.hash(randomBytes(32).toString('hex'), { type: argon2.argon2id });
const whatsappConfigured = Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);

function hash(value: string): string {
  return createHmac('sha256', env.SESSION_SECRET).update(value).digest('hex');
}

function generateWorkspaceAccessCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'LAB-';
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

async function getUniqueWorkspaceAccessCode(transaction: typeof prisma, excludeId?: string): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateWorkspaceAccessCode();
    const existing = await transaction.workspace.findUnique({ where: { accessCode: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
  }
  throw new Error('Não foi possível gerar um código único para este ambiente.');
}

async function ensureWorkspaceAccessCode(workspaceId: string, accessCode: string | null): Promise<string> {
  if (accessCode) return accessCode;
  const code = await getUniqueWorkspaceAccessCode(prisma, workspaceId);
  await prisma.workspace.update({ where: { id: workspaceId }, data: { accessCode: code } });
  return code;
}

function alarmStatusLabel(status: string): string {
  if (status === 'online') return 'normalizado';
  if (status === 'warning') return 'em atenção';
  return 'offline';
}

function canManageWhatsApp(email: string): boolean {
  return Boolean(bootstrapAdminEmail && email.trim().toLowerCase() === bootstrapAdminEmail);
}

function emailIsConfigured(): boolean {
  const settings = getEmailNotificationSettings();
  return Boolean(settings.smtpHost && settings.smtpUser && settings.passwordConfigured && settings.senderEmail);
}

function formatEmailAlarmMessage(settings: ReturnType<typeof getEmailNotificationSettings>, device: { name: string; externalId: string; location: string | null }, status: string): string {
  const template = status === 'online' ? settings.onlineMessage : status === 'warning' ? settings.warningMessage : settings.offlineMessage;
  const values: Record<string, string> = {
    laboratorio: settings.senderName,
    aparelho: device.name,
    status: alarmStatusLabel(status),
    localizacao: device.location || 'não informada',
    identificador: device.externalId
  };
  return template.replace(/\{\{([^{}]+)\}\}/g, (_placeholder, key: string) => values[key] ?? '');
}

async function sendAlarmNotifications(device: { name: string; externalId: string; location: string | null; workspaceId: string | null }, status: string) {
  if (!device.workspaceId) return;
  const recipients = await prisma.user.findMany({
    where: { memberships: { some: { workspaceId: device.workspaceId } } },
    select: { email: true, emailNotifications: true, whatsappNumber: true, whatsappNotifications: true }
  });
  const emailRecipients = recipients.filter((recipient) => recipient.emailNotifications);
  const whatsappRecipients = recipients.filter((recipient) => recipient.whatsappNotifications && recipient.whatsappNumber);
  const emailSettings = emailRecipients.length && emailIsConfigured() ? getEmailNotificationSettings() : null;
  const message = emailSettings
    ? formatEmailAlarmMessage(emailSettings, device, status)
    : `O aparelho ${device.name} está ${alarmStatusLabel(status)}. Localização: ${device.location || 'não informada'}.`;
  const whatsappSettings = whatsappRecipients.length ? await getWhatsAppNotificationSettings() : null;
  const whatsappMessage = whatsappSettings
    ? formatWhatsAppNotificationMessage(whatsappSettings, device, status, alarmStatusLabel(status))
    : message;
  const deliveries: Promise<void>[] = [];

  if (emailRecipients.length && emailSettings) {
    for (const recipient of emailRecipients) {
      deliveries.push(sendEmailMessage('Alerta de monitoramento', {
        to: recipient.email,
        subject: `Alerta de monitoramento: ${device.name}`,
        text: message
      }).catch((error: unknown) => {
        app.log.error({ err: error, deviceId: device.externalId, channel: 'email' }, 'Falha ao enviar notificacao de alarme');
      }));
    }
  } else if (emailRecipients.length) {
    app.log.warn({ deviceId: device.externalId }, 'Notificacoes por e-mail indisponiveis: configure as variaveis SMTP.');
  }

  if (whatsappRecipients.length && getWhatsAppWebStatus().state === 'connected') {
    for (const recipient of whatsappRecipients) {
      const phone = recipient.whatsappNumber;
      if (!phone) continue;
      deliveries.push(sendWhatsAppWebMessage(phone, whatsappMessage, status === 'online' ? 'success' : 'alert').catch((error: unknown) => {
        app.log.error({ err: error, deviceId: device.externalId, channel: 'whatsapp_web' }, 'Falha ao enviar notificacao por WhatsApp Web');
      }));
    }
  } else if (whatsappRecipients.length && whatsappConfigured && env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID) {
    const endpoint = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    for (const recipient of whatsappRecipients) {
      const phone = recipient.whatsappNumber;
      if (!phone) continue;
      deliveries.push(fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.slice(1),
          type: 'template',
          template: {
            name: env.WHATSAPP_TEMPLATE_NAME,
            language: { code: env.WHATSAPP_TEMPLATE_LANGUAGE },
            ...(env.WHATSAPP_TEMPLATE_NAME === 'hello_world' ? {} : {
              components: [{
                type: 'body',
                parameters: [
                  { type: 'text', text: device.name },
                  { type: 'text', text: alarmStatusLabel(status) },
                  { type: 'text', text: device.location || 'não informada' }
                ]
              }]
            })
          }
        }),
        signal: AbortSignal.timeout(10_000)
      }).then((response) => {
        if (!response.ok) throw new Error(`WhatsApp Cloud API retornou HTTP ${response.status}.`);
      }).catch((error: unknown) => {
        app.log.error({ err: error, deviceId: device.externalId, channel: 'whatsapp' }, 'Falha ao enviar notificacao de alarme');
      }));
    }
  } else if (whatsappRecipients.length) {
    app.log.warn({ deviceId: device.externalId }, 'Notificacoes por WhatsApp indisponiveis: configure as credenciais da Meta Cloud API.');
  }

  await Promise.all(deliveries);
}

async function notifyAlarmStatusChange(device: { name: string; externalId: string; location: string | null; workspaceId: string | null }, status: string) {
  try {
    await sendAlarmNotifications(device, status);
  } catch (error) {
    app.log.error({ err: error, deviceId: device.externalId }, 'Falha ao processar notificacoes de alarme');
  }
}

function createCsrfToken(sessionToken: string): string {
  return createHmac('sha256', env.SESSION_SECRET).update('csrf:').update(sessionToken).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  return timingSafeEqual(Buffer.from(hash(left)), Buffer.from(hash(right)));
}

function matchesHash(value: string, expectedHash: string): boolean {
  const actual = Buffer.from(hash(value), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function getUserContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { memberships: { include: { workspace: { select: { id: true, name: true, accessCode: true, iconDataUrl: true } } } } }
  });
  if (!user) return null;

  const workspaces = await Promise.all(user.memberships.map(async (membership) => ({
    id: membership.workspaceId,
    name: membership.workspace.name,
    role: membership.role,
    accessCode: await ensureWorkspaceAccessCode(membership.workspaceId, membership.workspace.accessCode),
    iconDataUrl: membership.workspace.iconDataUrl
  })));
  const activeWorkspaceId = workspaces.some((workspace) => workspace.id === user.activeWorkspaceId)
    ? user.activeWorkspaceId
    : workspaces[0]?.id ?? null;
  if (activeWorkspaceId !== user.activeWorkspaceId) {
    await prisma.user.update({ where: { id: user.id }, data: { activeWorkspaceId } });
  }

  const isBootstrapAdmin = Boolean(bootstrapAdminEmail && user.email.toLowerCase() === bootstrapAdminEmail);
  const isPlatformAdmin = user.isPlatformAdmin || isBootstrapAdmin;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarDataUrl: user.avatarDataUrl,
    whatsappNumber: user.whatsappNumber,
    emailNotifications: user.emailNotifications,
    whatsappNotifications: user.whatsappNotifications,
    emailVerifiedAt: user.emailVerifiedAt,
    isPlatformAdmin,
    isBootstrapAdmin,
    activeWorkspaceId,
    workspaces
  };
}

function getWorkspaceRole(user: { workspaces: Array<{ id: string; role: string }> }, workspaceId: string) {
  return user.workspaces.find((workspace) => workspace.id === workspaceId)?.role ?? null;
}

function canManageWorkspace(role: string | null) {
  return role === 'owner' || role === 'admin';
}

async function getSession(request: FastifyRequest) {
  const rawToken = request.cookies[cookieName];
  if (!rawToken) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hash(rawToken) }
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  const user = await getUserContext(session.userId);
  if (!user) return null;
  return { session, user, rawToken };
}

async function requireSession(request: FastifyRequest, reply: FastifyReply) {
  const auth = await getSession(request);
  if (!auth) {
    await reply.code(401).send({ error: 'Autenticacao necessaria.' });
    return null;
  }
  return auth;
}

async function requireCsrf(request: FastifyRequest, reply: FastifyReply) {
  const auth = await requireSession(request, reply);
  if (!auth) return null;
  const supplied = request.headers['x-csrf-token'];
  if (typeof supplied !== 'string' || !matchesHash(supplied, auth.session.csrfHash)) {
    await reply.code(403).send({ error: 'Token CSRF invalido.' });
    return null;
  }
  return auth;
}

app.register(helmet);
app.register(cors, { origin: env.DASHBOARD_ORIGIN, credentials: true, methods: ['GET', 'POST', 'OPTIONS'] });
app.register(cookie);
app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

app.get('/health', async () => ({ status: 'ok' }));

async function getRegistrationSetting() {
  return prisma.globalSetting.upsert({
    where: { id: 'global' },
    update: {},
    create: { id: 'global', publicRegistrationEnabled: false }
  });
}

function buildDashboardUrl(params: Record<string, string>) {
  const url = new URL('/', env.DASHBOARD_ORIGIN);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.href;
}

app.get('/api/auth/registration-settings', async () => {
  const setting = await getRegistrationSetting();
  return { enabled: setting.publicRegistrationEnabled, emailAvailable: emailIsConfigured() };
});

app.post('/api/admin/registration-settings', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador da plataforma.' });
  const parsed = registrationSettingSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Configuração de cadastro inválida.' });
  const setting = await prisma.globalSetting.upsert({
    where: { id: 'global' },
    update: { publicRegistrationEnabled: parsed.data.enabled },
    create: { id: 'global', publicRegistrationEnabled: parsed.data.enabled }
  });
  return { enabled: setting.publicRegistrationEnabled };
});

app.get('/api/admin/email/settings', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de e-mail.' });
  reply.header('Cache-Control', 'no-store');
  return { settings: getEmailNotificationSettings() };
});

app.post('/api/admin/email/settings', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de e-mail.' });
  const parsed = emailNotificationSettingsSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Confira os dados SMTP e os modelos de mensagem.' });
  try {
    return { settings: await saveEmailNotificationSettings(parsed.data) };
  } catch (error) {
    app.log.error({ err: error }, 'Falha ao salvar configuracao SMTP');
    return reply.code(500).send({ error: 'Não foi possível salvar a configuração de e-mail.' });
  }
});

app.get('/api/admin/email/logs', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de e-mail.' });
  reply.header('Cache-Control', 'no-store');
  return { logs: getEmailNotificationLogs() };
});

app.post('/api/admin/email/logs/clear', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de e-mail.' });
  clearEmailNotificationLogs();
  return { ok: true };
});

app.post('/api/admin/email/test', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de e-mail.' });
  try {
    await verifyEmailConnection();
    return { ok: true, message: 'Conexão SMTP verificada.' };
  } catch (error) {
    return reply.code(503).send({
      error: error instanceof Error ? error.message : 'Não foi possível testar o servidor SMTP.'
    });
  }
});

app.get('/api/admin/whatsapp', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de WhatsApp.' });
  reply.header('Cache-Control', 'no-store');
  return getWhatsAppWebStatus();
});

app.get('/api/admin/whatsapp/settings', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de WhatsApp.' });
  reply.header('Cache-Control', 'no-store');
  return { settings: await getWhatsAppNotificationSettings() };
});

app.post('/api/admin/whatsapp/settings', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de WhatsApp.' });
  const parsed = whatsappNotificationSettingsSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Confira o nome e os modelos de mensagem do WhatsApp.' });
  return { settings: await saveWhatsAppNotificationSettings(parsed.data) };
});

app.get('/api/admin/whatsapp/logs', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de WhatsApp.' });
  reply.header('Cache-Control', 'no-store');
  return { logs: getWhatsAppWebLogs() };
});

app.post('/api/admin/whatsapp/logs/clear', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de WhatsApp.' });
  clearWhatsAppWebLogs();
  return { ok: true };
});

app.post('/api/admin/whatsapp/connect', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de WhatsApp.' });
  try {
    return await connectWhatsAppWeb();
  } catch (error) {
    app.log.error({ err: error }, 'Falha ao iniciar conexao do WhatsApp Web');
    return reply.code(503).send({ error: 'Não foi possível iniciar a conexão com o WhatsApp.' });
  }
});

app.post('/api/admin/whatsapp/disconnect', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de WhatsApp.' });
  return disconnectWhatsAppWeb();
});

app.get<{ Params: { token: string } }>('/api/auth/invitations/:token', async (request, reply) => {
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { tokenHash: hash(request.params.token) },
    include: { workspace: { select: { name: true } } }
  });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
    return reply.code(404).send({ error: 'Convite inválido ou expirado.' });
  }
  return { email: invitation.email, workspaceName: invitation.workspace.name };
});

app.post('/api/auth/register', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request, reply) => {
  const parsed = registrationSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Confira o e-mail, nome, senha e ambiente.' });
  if (!emailIsConfigured()) return reply.code(503).send({ error: 'Cadastro indisponível: configure o envio de e-mail no servidor.' });

  const email = parsed.data.email.toLowerCase();
  let invitation: Awaited<ReturnType<typeof prisma.workspaceInvitation.findUnique>> = null;
  if (parsed.data.invitationToken) {
    invitation = await prisma.workspaceInvitation.findUnique({ where: { tokenHash: hash(parsed.data.invitationToken) } });
    if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date() || invitation.email !== email) {
      return reply.code(400).send({ error: 'Convite inválido, expirado ou destinado a outro e-mail.' });
    }
  } else {
    const setting = await getRegistrationSetting();
    if (!setting.publicRegistrationEnabled) return reply.code(403).send({ error: 'O cadastro público está desativado.' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser && !invitation) return reply.code(409).send({ error: 'Este e-mail já possui uma conta.' });
  if (existingUser && invitation) {
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: existingUser.id } },
      update: { role: invitation.role },
      create: { workspaceId: invitation.workspaceId, userId: existingUser.id, role: invitation.role }
    });
    await prisma.workspaceInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
    return { message: 'A conta existente foi adicionada ao ambiente.' };
  }

  const rawToken = randomBytes(32).toString('base64url');
  await prisma.pendingRegistration.deleteMany({ where: { email } });
  await prisma.pendingRegistration.create({
    data: {
      email,
      displayName: parsed.data.displayName,
      passwordHash: await argon2.hash(parsed.data.password, { type: argon2.argon2id }),
      workspaceName: invitation ? null : parsed.data.workspaceName,
      workspaceId: invitation?.workspaceId,
      invitationId: invitation?.id,
      tokenHash: hash(rawToken),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
  try {
    await sendEmailMessage('Ativação de conta', {
      to: email,
      subject: 'Confirme sua conta - LAB/MONITOR',
      text: `Olá, ${parsed.data.displayName}. Confirme seu e-mail em até 24 horas pelo link abaixo:\n\n${buildDashboardUrl({ activationToken: rawToken })}`
    });
  } catch (error) {
    await prisma.pendingRegistration.deleteMany({ where: { email } });
    app.log.error({ err: error }, 'Falha ao enviar ativação de cadastro');
    return reply.code(503).send({ error: 'Não foi possível enviar o e-mail de ativação. Tente novamente mais tarde.' });
  }
  return reply.code(202).send({ message: 'Enviamos um link de ativação para o e-mail informado.' });
});

app.post('/api/auth/verify-email', async (request, reply) => {
  const parsed = tokenSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Token de ativação inválido.' });
  const pending = await prisma.pendingRegistration.findUnique({ where: { tokenHash: hash(parsed.data.token) } });
  if (!pending || pending.expiresAt <= new Date()) {
    if (pending) await prisma.pendingRegistration.delete({ where: { id: pending.id } });
    return reply.code(400).send({ error: 'Link de ativação inválido ou expirado. Cadastre-se novamente.' });
  }
  if (await prisma.user.findUnique({ where: { email: pending.email }, select: { id: true } })) {
    await prisma.pendingRegistration.delete({ where: { id: pending.id } });
    return reply.code(409).send({ error: 'Este e-mail já possui uma conta.' });
  }

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: pending.email,
        displayName: pending.displayName,
        passwordHash: pending.passwordHash,
        emailVerifiedAt: new Date()
      }
    });
    const workspace = pending.workspaceId
      ? await tx.workspace.findUniqueOrThrow({ where: { id: pending.workspaceId } })
      : await tx.workspace.create({ data: { name: pending.workspaceName ?? 'Meu ambiente' } });
    const invitation = pending.invitationId
      ? await tx.workspaceInvitation.findUniqueOrThrow({ where: { id: pending.invitationId } })
      : null;
    await tx.workspaceMember.create({
      data: { workspaceId: workspace.id, userId: createdUser.id, role: invitation?.role ?? 'owner' }
    });
    const updatedUser = await tx.user.update({
      where: { id: createdUser.id },
      data: { activeWorkspaceId: workspace.id },
      select: { id: true, email: true, displayName: true }
    });
    if (invitation) await tx.workspaceInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
    await tx.pendingRegistration.delete({ where: { id: pending.id } });
    return updatedUser;
  });
  return reply.code(201).send({ user, message: 'E-mail confirmado. Sua conta já pode entrar.' });
});

app.post('/api/auth/login', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request, reply) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Credenciais invalidas.' });

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = await argon2.verify(user?.passwordHash ?? dummyPasswordHash, parsed.data.password);
  if (!user || !passwordMatches) return reply.code(401).send({ error: 'Email ou senha incorretos.' });
  const isBootstrapAdmin = Boolean(bootstrapAdminEmail && user.email.toLowerCase() === bootstrapAdminEmail);
  if (!user.emailVerifiedAt && !user.isPlatformAdmin && !isBootstrapAdmin) return reply.code(403).send({ error: 'Confirme seu e-mail antes de entrar.' });
  const userContext = await getUserContext(user.id);
  if (!userContext?.activeWorkspaceId) return reply.code(403).send({ error: 'Sua conta ainda não pertence a um ambiente.' });

  const rawToken = randomBytes(32).toString('base64url');
  const csrfToken = createCsrfToken(rawToken);
  await prisma.session.create({
    data: { tokenHash: hash(rawToken), csrfHash: hash(csrfToken), userId: user.id, expiresAt: new Date(Date.now() + sessionDurationMs) }
  });
  await prisma.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  return reply.setCookie(cookieName, rawToken, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'lax',
    path: '/',
    maxAge: sessionDurationMs / 1000
  }).send({
    user: userContext,
    csrfToken
  });
});

app.get('/api/auth/me', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  const isBootstrapAdmin = Boolean(bootstrapAdminEmail && auth.user.email.toLowerCase() === bootstrapAdminEmail);
  if (!auth.user.emailVerifiedAt && !auth.user.isPlatformAdmin && !isBootstrapAdmin) return reply.code(403).send({ error: 'Confirme seu e-mail antes de entrar.' });
  const csrfToken = createCsrfToken(auth.rawToken);
  await prisma.session.update({ where: { id: auth.session.id }, data: { csrfHash: hash(csrfToken) } });
  return { user: auth.user, csrfToken };
});

app.get('/api/workspaces', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  return {
    workspaces: auth.user.workspaces,
    activeWorkspaceId: auth.user.activeWorkspaceId,
    isPlatformAdmin: auth.user.isPlatformAdmin,
    isBootstrapAdmin: auth.user.isBootstrapAdmin
  };
});

app.post('/api/workspaces', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  const parsed = createWorkspaceSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Informe um nome de ambiente entre 2 e 80 caracteres.' });
  const accessCode = await getUniqueWorkspaceAccessCode(prisma);
  const workspace = await prisma.$transaction(async (tx) => {
    const created = await tx.workspace.create({
      data: { name: parsed.data.name, accessCode, iconDataUrl: parsed.data.iconDataUrl ?? null }
    });
    await tx.workspaceMember.create({ data: { workspaceId: created.id, userId: auth.user.id, role: 'owner' } });
    await tx.user.update({ where: { id: auth.user.id }, data: { activeWorkspaceId: created.id } });
    return created;
  });
  return reply.code(201).send({ workspace, activeWorkspaceId: workspace.id });
});

app.patch<{ Params: { workspaceId: string } }>('/api/workspaces/:workspaceId', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  if (!canManageWorkspace(getWorkspaceRole(auth.user, request.params.workspaceId))) {
    return reply.code(403).send({ error: 'Sem permissão para editar este ambiente.' });
  }
  const parsed = updateWorkspaceSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Informe um nome válido e uma imagem WebP aceita.' });
  const workspace = await prisma.workspace.update({
    where: { id: request.params.workspaceId },
    data: { name: parsed.data.name, iconDataUrl: parsed.data.iconDataUrl }
  });
  return { workspace };
});

app.delete<{ Params: { workspaceId: string } }>('/api/workspaces/:workspaceId', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  const { workspaceId } = request.params;
  const role = getWorkspaceRole(auth.user, workspaceId);
  if (!role) return reply.code(403).send({ error: 'Você não pertence a esse ambiente.' });

  const action = role === 'owner' ? 'deleted' : 'removed';
  const activeWorkspaceId = await prisma.$transaction(async (tx) => {
    const nextMembership = await tx.workspaceMember.findFirst({
      where: { userId: auth.user.id, workspaceId: { not: workspaceId } },
      orderBy: { createdAt: 'asc' },
      select: { workspaceId: true }
    });
    if (action === 'deleted') {
      const linkedDevices = await tx.deviceLink.findMany({
        where: { device: { workspaceId } },
        select: { deviceId: true, userId: true }
      });
      for (const link of linkedDevices) {
        await tx.device.updateMany({
          where: { id: link.deviceId, ownerUserId: null },
          data: { ownerUserId: link.userId }
        });
      }
      await tx.device.updateMany({
        where: { workspaceId, ownerUserId: null },
        data: { ownerUserId: auth.user.id }
      });
      await tx.workspace.delete({ where: { id: workspaceId } });
    } else {
      await tx.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId, userId: auth.user.id } }
      });
    }
    await tx.user.update({ where: { id: auth.user.id }, data: { activeWorkspaceId: nextMembership?.workspaceId ?? null } });
    return nextMembership?.workspaceId ?? null;
  });

  return { action, activeWorkspaceId };
});

app.post('/api/workspaces/join', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  const parsed = joinWorkspaceSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Informe um código de ambiente válido.' });

  const normalizedCode = parsed.data.code.trim().toUpperCase();
  const workspace = await prisma.workspace.findUnique({
    where: { accessCode: normalizedCode },
    select: { id: true, name: true, accessCode: true }
  });
  if (!workspace) return reply.code(404).send({ error: 'Código de ambiente não encontrado.' });

  const existingMembership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: auth.user.id } }
  });

  if (!existingMembership) {
    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: auth.user.id, role: 'member' }
      }),
      prisma.user.update({ where: { id: auth.user.id }, data: { activeWorkspaceId: workspace.id } })
    ]);
  } else {
    await prisma.user.update({ where: { id: auth.user.id }, data: { activeWorkspaceId: workspace.id } });
  }

  return {
    workspace: { id: workspace.id, name: workspace.name, role: existingMembership?.role ?? 'member', accessCode: workspace.accessCode },
    activeWorkspaceId: workspace.id,
    message: existingMembership ? 'Você já fazia parte deste ambiente.' : 'Ambiente importado com sucesso.'
  };
});

app.post('/api/workspaces/active', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  const parsed = activeWorkspaceSchema.safeParse(request.body);
  if (!parsed.success || !getWorkspaceRole(auth.user, parsed.data.workspaceId)) {
    return reply.code(403).send({ error: 'Você não pertence a esse ambiente.' });
  }
  await prisma.user.update({ where: { id: auth.user.id }, data: { activeWorkspaceId: parsed.data.workspaceId } });
  return { activeWorkspaceId: parsed.data.workspaceId };
});

app.get<{ Params: { workspaceId: string } }>('/api/workspaces/:workspaceId/members', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de usuários.' });
  const role = getWorkspaceRole(auth.user, request.params.workspaceId);
  if (!canManageWorkspace(role)) return reply.code(403).send({ error: 'Sem permissão para gerenciar este ambiente.' });
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: request.params.workspaceId },
    include: { user: { select: { id: true, email: true, displayName: true, emailVerifiedAt: true, isPlatformAdmin: true } } },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }]
  });
  return {
    members: members.map(({ user, role: memberRole, createdAt }) => ({
      ...user,
      isPlatformAdmin: user.isPlatformAdmin || Boolean(bootstrapAdminEmail && user.email.toLowerCase() === bootstrapAdminEmail),
      role: memberRole,
      createdAt
    }))
  };
});

app.get<{ Params: { workspaceId: string } }>('/api/workspaces/:workspaceId/invitations', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de usuários.' });
  if (!canManageWorkspace(getWorkspaceRole(auth.user, request.params.workspaceId))) {
    return reply.code(403).send({ error: 'Sem permissão para gerenciar este ambiente.' });
  }
  const invitations = await prisma.workspaceInvitation.findMany({
    where: { workspaceId: request.params.workspaceId, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  return { invitations };
});

app.post<{ Params: { workspaceId: string } }>('/api/workspaces/:workspaceId/invitations', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de usuários.' });
  if (!canManageWorkspace(getWorkspaceRole(auth.user, request.params.workspaceId))) {
    return reply.code(403).send({ error: 'Sem permissão para convidar pessoas para este ambiente.' });
  }
  const parsed = inviteWorkspaceMemberSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Informe um e-mail válido.' });
  if (!emailIsConfigured()) return reply.code(503).send({ error: 'Convites indisponíveis: configure o envio de e-mail no servidor.' });

  const email = parsed.data.email.toLowerCase();
  if (auth.user.email.toLowerCase() === email && getWorkspaceRole(auth.user, request.params.workspaceId)) {
    return reply.code(409).send({ error: 'Você já pertence a este ambiente.' });
  }
  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser && await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: request.params.workspaceId, userId: existingUser.id } },
    select: { userId: true }
  })) return reply.code(409).send({ error: 'Este usuário já pertence ao ambiente.' });

  const workspace = await prisma.workspace.findUnique({ where: { id: request.params.workspaceId }, select: { name: true } });
  if (!workspace) return reply.code(404).send({ error: 'Ambiente não encontrado.' });
  const rawToken = randomBytes(32).toString('base64url');
  await prisma.workspaceInvitation.deleteMany({
    where: { workspaceId: request.params.workspaceId, email, acceptedAt: null }
  });
  const invitation = await prisma.workspaceInvitation.create({
    data: {
      workspaceId: request.params.workspaceId,
      createdByUserId: auth.user.id,
      email,
      role: parsed.data.role,
      tokenHash: hash(rawToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    select: { id: true, email: true, role: true, expiresAt: true }
  });
  try {
    await sendEmailMessage('Convite de ambiente', {
      to: email,
      subject: `Convite para ${workspace.name} - LAB/MONITOR`,
      text: `Você foi convidado para o ambiente ${workspace.name}. Aceite o convite em até 7 dias:\n\n${buildDashboardUrl({ invitationToken: rawToken })}`
    });
  } catch (error) {
    await prisma.workspaceInvitation.delete({ where: { id: invitation.id } });
    app.log.error({ err: error, workspaceId: request.params.workspaceId }, 'Falha ao enviar convite de ambiente');
    return reply.code(503).send({ error: 'Não foi possível enviar o convite por e-mail.' });
  }
  return reply.code(201).send({ invitation, message: 'Convite enviado por e-mail.' });
});

app.post('/api/workspaces/invitations/accept', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  const parsed = tokenSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Token de convite inválido.' });
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { tokenHash: hash(parsed.data.token) },
    include: { workspace: { select: { id: true, name: true } } }
  });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
    return reply.code(400).send({ error: 'Convite inválido ou expirado.' });
  }
  if (invitation.email !== auth.user.email.toLowerCase()) {
    return reply.code(403).send({ error: 'Entre com o e-mail que recebeu este convite.' });
  }
  await prisma.$transaction([
    prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: auth.user.id } },
      update: { role: invitation.role },
      create: { workspaceId: invitation.workspaceId, userId: auth.user.id, role: invitation.role }
    }),
    prisma.workspaceInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } }),
    prisma.user.update({ where: { id: auth.user.id }, data: { activeWorkspaceId: invitation.workspaceId } })
  ]);
  return { workspace: invitation.workspace, activeWorkspaceId: invitation.workspaceId };
});

app.patch<{ Params: { workspaceId: string } }>('/api/workspaces/:workspaceId/members', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de usuários.' });
  const callerRole = getWorkspaceRole(auth.user, request.params.workspaceId);
  if (!canManageWorkspace(callerRole)) return reply.code(403).send({ error: 'Sem permissão para alterar membros.' });
  const parsed = updateWorkspaceMemberSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Papel de usuário inválido.' });
  const target = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: request.params.workspaceId, userId: parsed.data.userId } },
    include: { user: { select: { email: true, isPlatformAdmin: true } } }
  });
  if (!target) return reply.code(404).send({ error: 'Usuário não encontrado neste ambiente.' });
  if (target.user.isPlatformAdmin || Boolean(bootstrapAdminEmail && target.user.email.toLowerCase() === bootstrapAdminEmail)) {
    return reply.code(403).send({ error: 'O papel da conta administradora da plataforma não pode ser alterado.' });
  }
  if (target.role === 'owner' && callerRole !== 'owner') return reply.code(403).send({ error: 'Somente o dono pode alterar o papel de outro dono.' });
  await prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId: request.params.workspaceId, userId: parsed.data.userId } },
    data: { role: parsed.data.role }
  });
  return { ok: true };
});

app.delete<{ Params: { workspaceId: string; userId: string } }>('/api/workspaces/:workspaceId/members/:userId', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  if (!canManageWhatsApp(auth.user.email)) return reply.code(403).send({ error: 'Acesso restrito ao administrador de usuários.' });
  const callerRole = getWorkspaceRole(auth.user, request.params.workspaceId);
  if (!canManageWorkspace(callerRole)) return reply.code(403).send({ error: 'Sem permissão para remover membros.' });
  const target = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: request.params.workspaceId, userId: request.params.userId } }
  });
  if (!target) return reply.code(404).send({ error: 'Usuário não encontrado neste ambiente.' });
  if (target.role === 'owner') {
    const owners = await prisma.workspaceMember.count({ where: { workspaceId: request.params.workspaceId, role: 'owner' } });
    if (owners <= 1) return reply.code(409).send({ error: 'O ambiente precisa manter pelo menos um dono.' });
    if (callerRole !== 'owner') return reply.code(403).send({ error: 'Somente um dono pode remover outro dono.' });
  }
  await prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId: request.params.workspaceId, userId: request.params.userId } }
  });
  if (request.params.userId === auth.user.id) {
    const nextMembership = await prisma.workspaceMember.findFirst({ where: { userId: auth.user.id }, orderBy: { createdAt: 'asc' } });
    await prisma.user.update({ where: { id: auth.user.id }, data: { activeWorkspaceId: nextMembership?.workspaceId ?? null } });
  }
  return { ok: true };
});

app.post('/api/auth/forgot-password', { config: { rateLimit: { max: 3, timeWindow: '15 minutes' } } }, async (request, reply) => {
  const parsed = forgotPasswordSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Informe um e-mail valido.' });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (user && emailIsConfigured()) {
    const rawToken = randomBytes(32).toString('base64url');
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { tokenHash: hash(rawToken), userId: user.id, expiresAt: new Date(Date.now() + 30 * 60 * 1000) }
    });

    const resetUrl = new URL('/', env.DASHBOARD_ORIGIN);
    resetUrl.searchParams.set('resetToken', rawToken);
    try {
      await sendEmailMessage('Recuperação de senha', {
        to: user.email,
        subject: 'Redefinicao de senha - LAB/MONITOR',
        text: `Recebemos um pedido para redefinir a senha da sua conta. Acesse este link em ate 30 minutos:\n\n${resetUrl.href}\n\nSe voce nao solicitou a redefinicao, ignore esta mensagem.`
      });
    } catch (error) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      app.log.error({ err: error }, 'Falha ao enviar e-mail de redefinicao');
    }
  } else if (!emailIsConfigured()) {
    app.log.warn('Recuperacao de senha indisponivel: configure as variaveis SMTP.');
  }

  return reply.send({ message: 'Se o e-mail estiver cadastrado, voce recebera instrucoes para redefinir a senha.' });
});

app.post('/api/auth/reset-password', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request, reply) => {
  const parsed = resetPasswordSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Token ou nova senha invalidos. A senha deve ter pelo menos 12 caracteres.' });

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hash(parsed.data.token) } });
  if (!resetToken || resetToken.expiresAt <= new Date()) {
    if (resetToken) await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    return reply.code(400).send({ error: 'Este link expirou ou ja foi utilizado. Solicite outro.' });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: await argon2.hash(parsed.data.password, { type: argon2.argon2id }) }
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } }),
    prisma.session.deleteMany({ where: { userId: resetToken.userId } })
  ]);
  return { ok: true, message: 'Senha redefinida. Entre com sua nova senha.' };
});

app.post('/api/account/profile', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  const parsed = updateProfileSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Confira nome, e-mail, foto, número de WhatsApp e preferências de notificação.' });

  const currentUser = await prisma.user.findUnique({ where: { id: auth.user.id } });
  if (!currentUser || !(await argon2.verify(currentUser.passwordHash, parsed.data.currentPassword))) {
    return reply.code(401).send({ error: 'Senha atual incorreta.' });
  }
  const email = parsed.data.email.toLowerCase();
  const emailInUse = await prisma.user.findFirst({ where: { email, id: { not: auth.user.id } }, select: { id: true } });
  if (emailInUse) return reply.code(409).send({ error: 'Este e-mail ja esta sendo usado por outra conta.' });

  try {
    const updatedUser = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        displayName: parsed.data.displayName,
        email,
        avatarDataUrl: parsed.data.avatarDataUrl,
        whatsappNumber: parsed.data.whatsappNumber,
        emailNotifications: parsed.data.emailNotifications,
        whatsappNotifications: parsed.data.whatsappNotifications
      },
      select: {
        id: true, email: true, displayName: true, avatarDataUrl: true, whatsappNumber: true,
        emailNotifications: true, whatsappNotifications: true
      }
    });
    return { user: updatedUser };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return reply.code(409).send({ error: 'Este e-mail ja esta sendo usado por outra conta.' });
    }
    throw error;
  }
});

app.post('/api/account/password', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  const parsed = changePasswordSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'A nova senha deve ter pelo menos 12 caracteres.' });
  const currentUser = await prisma.user.findUnique({ where: { id: auth.user.id } });
  if (!currentUser || !(await argon2.verify(currentUser.passwordHash, parsed.data.currentPassword))) {
    return reply.code(401).send({ error: 'Senha atual incorreta.' });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: auth.user.id },
      data: { passwordHash: await argon2.hash(parsed.data.newPassword, { type: argon2.argon2id }) }
    }),
    prisma.session.deleteMany({ where: { userId: auth.user.id, id: { not: auth.session.id } } })
  ]);
  return { ok: true, message: 'Senha atualizada. As outras sessoes foram encerradas.' };
});

app.post('/api/auth/logout', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  await prisma.session.delete({ where: { id: auth.session.id } });
  return reply.clearCookie(cookieName, { path: '/', secure: secureCookie, sameSite: 'lax', httpOnly: true }).send({ ok: true });
});

app.post('/api/device-links/workspaces', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request, reply) => {
  const parsed = deviceLinkWorkspacesSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Informe o e-mail e a senha da conta LAB/MONITOR.' });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  const passwordMatches = await argon2.verify(user?.passwordHash ?? dummyPasswordHash, parsed.data.password);
  if (!user || !passwordMatches) return reply.code(401).send({ error: 'E-mail ou senha inválidos, ou conta não ativada.' });
  const isBootstrapAdmin = Boolean(bootstrapAdminEmail && user.email.toLowerCase() === bootstrapAdminEmail);
  if (!user.emailVerifiedAt && !user.isPlatformAdmin && !isBootstrapAdmin) {
    return reply.code(401).send({ error: 'E-mail ou senha inválidos, ou conta não ativada.' });
  }
  const context = await getUserContext(user.id);
  return { workspaces: context?.workspaces.map(({ id, name }) => ({ id, name })) ?? [] };
});

app.post('/api/device-links/login', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request, reply) => {
  const parsed = deviceLinkLoginSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Dados de vinculo invalidos.' });

  const { email, password, externalId, name, location } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  const passwordMatches = await argon2.verify(user?.passwordHash ?? dummyPasswordHash, password);
  if (!user || !passwordMatches) return reply.code(401).send({ error: 'Email ou senha incorretos.' });
  if (!user.emailVerifiedAt) return reply.code(403).send({ error: 'Confirme o e-mail da conta antes de vincular o aparelho.' });
  const userContext = await getUserContext(user.id);
  const workspaceId = parsed.data.workspaceId ?? userContext?.activeWorkspaceId;
  if (!workspaceId || !getWorkspaceRole(userContext ?? { workspaces: [] }, workspaceId)) {
    return reply.code(403).send({ error: 'Selecione um ambiente ao qual sua conta pertence.' });
  }

  const existingDevice = await prisma.device.findUnique({ where: { externalId }, include: { deviceLink: true } });
  if (existingDevice?.workspaceId && existingDevice.workspaceId !== workspaceId) {
    return reply.code(409).send({ error: 'Este aparelho já pertence a outro ambiente. Remova o vínculo anterior primeiro.' });
  }
  if (existingDevice?.deviceLink && existingDevice.deviceLink.userId !== user.id) {
    return reply.code(409).send({ error: 'Este aparelho ja esta vinculado a outra conta.' });
  }

  const device = await prisma.device.upsert({
    where: { externalId },
    update: { workspaceId, ownerUserId: user.id, name, ...(location !== undefined ? { location } : {}), status: 'online', lastSeenAt: new Date() },
    create: { workspaceId, ownerUserId: user.id, externalId, name, location: location ?? null, status: 'online', lastSeenAt: new Date() }
  });
  if (existingDevice && existingDevice.status !== device.status) {
    await notifyAlarmStatusChange(device, device.status);
  }
  const deviceToken = randomBytes(32).toString('base64url');
  await prisma.deviceLink.upsert({
    where: { deviceId: device.id },
    update: { tokenHash: hash(deviceToken), userId: user.id },
    create: { tokenHash: hash(deviceToken), userId: user.id, deviceId: device.id }
  });
  return reply.code(201).send({ deviceToken, device: { externalId: device.externalId, name: device.name } });
});

app.post('/api/device-links/logout', async (request, reply) => {
  const authorization = request.headers.authorization ?? '';
  const deviceToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!deviceToken) return reply.code(401).send({ error: 'Vinculo de aparelho nao encontrado.' });
  const link = await prisma.deviceLink.findUnique({ where: { tokenHash: hash(deviceToken) }, include: { device: true } });
  if (!link) return reply.code(401).send({ error: 'Vinculo de aparelho invalido ou ja removido.' });
  await prisma.$transaction([
    prisma.deviceLink.delete({ where: { id: link.id } }),
    prisma.device.update({ where: { id: link.deviceId }, data: { status: 'offline' } })
  ]);
  if (link.device.status !== 'offline') {
    await notifyAlarmStatusChange(link.device, 'offline');
  }
  return { ok: true };
});

app.get('/api/devices', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  if (!auth.user.activeWorkspaceId) return reply.code(409).send({ error: 'Selecione ou crie um ambiente.' });
  const devices = await prisma.device.findMany({
    where: { workspaceId: auth.user.activeWorkspaceId },
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
    include: { readings: { orderBy: { recordedAt: 'desc' }, take: 15 } }
  });
  return {
    devices: devices.map(({ ownerUserId, ...device }) => ({
      ...device,
      canSimulate: device.externalId === simulatedDeviceExternalId && ownerUserId === auth.user.id
    }))
  };
});

app.get('/api/account/devices', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  const workspaceIds = auth.user.workspaces.map((workspace) => workspace.id);
  const workspaceRoles = new Map(auth.user.workspaces.map((workspace) => [workspace.id, workspace.role]));
  const deviceRelations = { workspace: { select: { id: true, name: true } }, deviceLink: { select: { userId: true } } };
  const [links, accessibleDevices, orphanedDevices] = await Promise.all([
    prisma.deviceLink.findMany({
      where: { userId: auth.user.id },
      include: { device: { include: deviceRelations } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.device.findMany({
      where: { OR: [{ workspaceId: { in: workspaceIds } }, { ownerUserId: auth.user.id }] },
      include: deviceRelations,
      orderBy: { name: 'asc' }
    }),
    auth.user.isPlatformAdmin
      ? prisma.device.findMany({
        where: { workspaceId: null, ownerUserId: null, deviceLink: { is: null } },
        include: deviceRelations,
        orderBy: { name: 'asc' }
      })
      : Promise.resolve([])
  ]);
  const devicesById = new Map(links.map(({ device }) => [device.id, device]));
  for (const device of accessibleDevices) devicesById.set(device.id, device);
  for (const device of orphanedDevices) devicesById.set(device.id, device);
  return {
    devices: [...devicesById.values()].map((device) => ({
      id: device.id,
      externalId: device.externalId,
      name: device.name,
      location: device.location,
      status: device.status,
      lastSeenAt: device.lastSeenAt,
      workspaceId: device.workspaceId,
      workspaceName: device.workspace?.name ?? null,
      canAssign: device.ownerUserId === auth.user.id
        || device.deviceLink?.userId === auth.user.id
        || canManageWorkspace(device.workspaceId ? workspaceRoles.get(device.workspaceId) ?? null : null)
        || (auth.user.isPlatformAdmin && !device.ownerUserId && !device.deviceLink && !device.workspaceId)
    }))
  };
});

app.post<{ Params: { workspaceId: string } }>('/api/workspaces/:workspaceId/devices', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  if (!getWorkspaceRole(auth.user, request.params.workspaceId)) {
    return reply.code(403).send({ error: 'Você não pertence a esse ambiente.' });
  }
  const parsed = assignWorkspaceDeviceSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Aparelho inválido.' });
  const device = await prisma.device.findUnique({
    where: { id: parsed.data.deviceId },
    include: { deviceLink: { select: { userId: true } } }
  });
  if (!device) return reply.code(404).send({ error: 'Aparelho não encontrado.' });
  const sourceRole = device.workspaceId ? getWorkspaceRole(auth.user, device.workspaceId) : null;
  const isAdminRecovery = auth.user.isPlatformAdmin && !device.ownerUserId && !device.deviceLink && !device.workspaceId;
  if (device.ownerUserId !== auth.user.id && device.deviceLink?.userId !== auth.user.id && !canManageWorkspace(sourceRole) && !isAdminRecovery) {
    return reply.code(403).send({ error: 'Você não tem permissão para mover este aparelho.' });
  }
  await prisma.device.update({
    where: { id: device.id },
    data: { workspaceId: request.params.workspaceId, ownerUserId: device.ownerUserId ?? device.deviceLink?.userId ?? auth.user.id }
  });
  return { ok: true, device: { id: device.id, name: device.name }, workspaceId: request.params.workspaceId };
});

app.get<{ Params: { id: string } }>('/api/devices/:id', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  if (!auth.user.activeWorkspaceId) return reply.code(409).send({ error: 'Selecione ou crie um ambiente.' });
  const device = await prisma.device.findUnique({
    where: { id: request.params.id, workspaceId: auth.user.activeWorkspaceId },
    include: { readings: { orderBy: { recordedAt: 'desc' }, take: 100 } }
  });
  if (!device) return reply.code(404).send({ error: 'Aparelho nao encontrado.' });
  return { device };
});

app.post<{ Params: { id: string } }>('/api/devices/:id/simulation', async (request, reply) => {
  const auth = await requireCsrf(request, reply);
  if (!auth) return;
  if (!auth.user.activeWorkspaceId) return reply.code(409).send({ error: 'Selecione um ambiente.' });
  const parsed = simulateDemoDeviceSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Valores de simulação inválidos.' });
  const device = await prisma.device.findUnique({
    where: { id: request.params.id, workspaceId: auth.user.activeWorkspaceId }
  });
  if (!device) return reply.code(404).send({ error: 'Aparelho não encontrado neste ambiente.' });
  if (device.externalId !== simulatedDeviceExternalId || device.ownerUserId !== auth.user.id) {
    return reply.code(403).send({ error: 'A simulação está disponível apenas para o aparelho fictício da sua conta.' });
  }

  const recordedAt = new Date();
  const updatedDevice = await prisma.$transaction(async (tx) => {
    const updated = await tx.device.update({
      where: { id: device.id },
      data: { status: parsed.data.status, lastSeenAt: recordedAt }
    });
    await tx.reading.createMany({
      data: [
        { deviceId: device.id, type: 'temperatura', value: parsed.data.temperature, unit: 'C', recordedAt },
        { deviceId: device.id, type: 'umidade', value: parsed.data.humidity, unit: '%', recordedAt },
        { deviceId: device.id, type: 'gas', value: parsed.data.gas, unit: 'ppm', recordedAt }
      ]
    });
    const readings = await tx.reading.findMany({
      where: { deviceId: device.id },
      orderBy: { recordedAt: 'desc' },
      take: 15
    });
    return { ...updated, readings };
  });
  if (device.status !== updatedDevice.status) await notifyAlarmStatusChange(updatedDevice, updatedDevice.status);
  return { device: { ...updatedDevice, canSimulate: true } };
});

app.post('/api/ingest/devices', async (request, reply) => {
  const authorization = request.headers.authorization ?? '';
  const suppliedKey = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const isSharedIngestionKey = safeEqual(suppliedKey, env.INGESTION_API_KEY);
  const deviceLink = isSharedIngestionKey || !suppliedKey
    ? null
    : await prisma.deviceLink.findUnique({ where: { tokenHash: hash(suppliedKey) }, include: { device: true } });
  if (!isSharedIngestionKey && !deviceLink) {
    return reply.code(401).send({ error: 'Chave de ingestao invalida.' });
  }

  const parsed = ingestionSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Payload invalido.', details: parsed.error.flatten() });
  const payload = parsed.data;
  if (deviceLink && deviceLink.device.externalId !== payload.externalId) {
    return reply.code(403).send({ error: 'Este token nao pode enviar dados para outro aparelho.' });
  }
  const latestReadingAt = payload.readings.reduce((latest, reading) => {
    const timestamp = reading.recordedAt ? new Date(reading.recordedAt) : new Date();
    return timestamp > latest ? timestamp : latest;
  }, new Date(0));
  const lastSeenAt = payload.readings.length ? latestReadingAt : new Date();
  const previousDevice = await prisma.device.findUnique({
    where: { externalId: payload.externalId },
    select: { status: true }
  });

  const device = await prisma.device.upsert({
    where: { externalId: payload.externalId },
    update: {
      name: payload.name,
      ...(payload.location !== undefined ? { location: payload.location } : {}),
      status: payload.status,
      lastSeenAt
    },
    create: { externalId: payload.externalId, name: payload.name, location: payload.location ?? null, status: payload.status, lastSeenAt }
  });
  if (payload.readings.length) {
    await prisma.reading.createMany({
      data: payload.readings.map((reading) => ({
        deviceId: device.id,
        type: reading.type,
        value: reading.value,
        unit: reading.unit,
        recordedAt: reading.recordedAt ? new Date(reading.recordedAt) : new Date()
      }))
    });
  }
  if ((previousDevice && previousDevice.status !== device.status) || (!previousDevice && device.status !== 'online')) {
    await notifyAlarmStatusChange(device, device.status);
  }
  return reply.code(201).send({ device, readingsStored: payload.readings.length });
});

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  return reply.code(500).send({ error: 'Erro interno do servidor.' });
});

try {
  await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
  void resumeWhatsAppWebSession().catch((error: unknown) => {
    app.log.error({ err: error }, 'Falha ao restaurar sessao do WhatsApp Web');
  });
} catch (error) {
  app.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    closeWhatsAppWebSocket();
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
