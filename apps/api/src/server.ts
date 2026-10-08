import dotenv from 'dotenv';
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import argon2 from 'argon2';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import nodemailer from 'nodemailer';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from './lib/prisma.js';
import {
  changePasswordSchema,
  deviceLinkLoginSchema,
  forgotPasswordSchema,
  ingestionSchema,
  loginSchema,
  resetPasswordSchema,
  updateProfileSchema
} from './lib/schemas.js';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DASHBOARD_ORIGIN: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  INGESTION_API_KEY: z.string().min(32),
  COOKIE_SECURE: z.enum(['true', 'false']).default('true'),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(1).max(254).optional()
});
const env = envSchema.parse(process.env);
const app = Fastify({ logger: true, bodyLimit: 512 * 1024 });
const cookieName = env.COOKIE_SECURE === 'true' ? '__Host-monitor_session' : 'monitor_session';
const sessionDurationMs = 12 * 60 * 60 * 1000;
const secureCookie = env.COOKIE_SECURE === 'true';
const dummyPasswordHash = await argon2.hash(randomBytes(32).toString('hex'), { type: argon2.argon2id });
const mailer = env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD && env.SMTP_FROM
  ? nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === 'true',
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
  })
  : null;

function hash(value: string): string {
  return createHmac('sha256', env.SESSION_SECRET).update(value).digest('hex');
}

function safeEqual(left: string, right: string): boolean {
  return timingSafeEqual(Buffer.from(hash(left)), Buffer.from(hash(right)));
}

function matchesHash(value: string, expectedHash: string): boolean {
  const actual = Buffer.from(hash(value), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function getSession(request: FastifyRequest) {
  const rawToken = request.cookies[cookieName];
  if (!rawToken) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hash(rawToken) },
    include: { user: { select: { id: true, email: true, displayName: true, avatarDataUrl: true } } }
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  return { session, user: session.user };
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

app.post('/api/auth/login', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request, reply) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Credenciais invalidas.' });

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = await argon2.verify(user?.passwordHash ?? dummyPasswordHash, parsed.data.password);
  if (!user || !passwordMatches) return reply.code(401).send({ error: 'Email ou senha incorretos.' });

  const rawToken = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(32).toString('base64url');
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
    user: { id: user.id, email: user.email, displayName: user.displayName, avatarDataUrl: user.avatarDataUrl },
    csrfToken
  });
});

app.get('/api/auth/me', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  const csrfToken = randomBytes(32).toString('base64url');
  await prisma.session.update({ where: { id: auth.session.id }, data: { csrfHash: hash(csrfToken) } });
  return { user: auth.user, csrfToken };
});

app.post('/api/auth/forgot-password', { config: { rateLimit: { max: 3, timeWindow: '15 minutes' } } }, async (request, reply) => {
  const parsed = forgotPasswordSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Informe um e-mail valido.' });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (user && mailer && env.SMTP_FROM) {
    const rawToken = randomBytes(32).toString('base64url');
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { tokenHash: hash(rawToken), userId: user.id, expiresAt: new Date(Date.now() + 30 * 60 * 1000) }
    });

    const resetUrl = new URL('/', env.DASHBOARD_ORIGIN);
    resetUrl.searchParams.set('resetToken', rawToken);
    try {
      await mailer.sendMail({
        from: env.SMTP_FROM,
        to: user.email,
        subject: 'Redefinicao de senha - LAB/MONITOR',
        text: `Recebemos um pedido para redefinir a senha da sua conta. Acesse este link em ate 30 minutos:\n\n${resetUrl.href}\n\nSe voce nao solicitou a redefinicao, ignore esta mensagem.`
      });
    } catch (error) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      app.log.error({ err: error }, 'Falha ao enviar e-mail de redefinicao');
    }
  } else if (!mailer) {
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
  if (!parsed.success) return reply.code(400).send({ error: 'Confira o nome, e-mail, foto e senha atual.' });

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
      data: { displayName: parsed.data.displayName, email, avatarDataUrl: parsed.data.avatarDataUrl },
      select: { id: true, email: true, displayName: true, avatarDataUrl: true }
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

app.post('/api/device-links/login', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request, reply) => {
  const parsed = deviceLinkLoginSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Dados de vinculo invalidos.' });

  const { email, password, externalId, name, location } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  const passwordMatches = await argon2.verify(user?.passwordHash ?? dummyPasswordHash, password);
  if (!user || !passwordMatches) return reply.code(401).send({ error: 'Email ou senha incorretos.' });

  const existingDevice = await prisma.device.findUnique({ where: { externalId }, include: { deviceLink: true } });
  if (existingDevice?.deviceLink && existingDevice.deviceLink.userId !== user.id) {
    return reply.code(409).send({ error: 'Este aparelho ja esta vinculado a outra conta.' });
  }

  const device = await prisma.device.upsert({
    where: { externalId },
    update: { name, ...(location !== undefined ? { location } : {}), status: 'online', lastSeenAt: new Date() },
    create: { externalId, name, location: location ?? null, status: 'online', lastSeenAt: new Date() }
  });
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
  return { ok: true };
});

app.get('/api/devices', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  const devices = await prisma.device.findMany({
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
    include: { readings: { orderBy: { recordedAt: 'desc' }, take: 15 } }
  });
  return { devices };
});

app.get<{ Params: { id: string } }>('/api/devices/:id', async (request, reply) => {
  const auth = await requireSession(request, reply);
  if (!auth) return;
  const device = await prisma.device.findUnique({
    where: { id: request.params.id },
    include: { readings: { orderBy: { recordedAt: 'desc' }, take: 100 } }
  });
  if (!device) return reply.code(404).send({ error: 'Aparelho nao encontrado.' });
  return { device };
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
  return reply.code(201).send({ device, readingsStored: payload.readings.length });
});

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  return reply.code(500).send({ error: 'Erro interno do servidor.' });
});

try {
  await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
