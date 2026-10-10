import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, type WASocket } from '@whiskeysockets/baileys';
import { pino } from 'pino';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { whatsappNotificationSettingsSchema, whatsappPrivacySettingsSchema } from './schemas.js';
import { getFavoriteWhatsAppMedia, getFavoriteWhatsAppMediaBuffer, type WhatsAppMediaType } from './whatsapp-media-library.js';
import { getAppLogger } from './app-logger.js';

const authDirectory = resolve(process.cwd(), '.data/whatsapp-auth');
const profileHistoryDirectory = resolve(process.cwd(), '.data/whatsapp-profile-history');
const notificationSettingsPath = resolve(process.cwd(), '.data/whatsapp-settings.json');
const logger = pino({ level: 'silent' });
const apiServerLogger = getAppLogger('api-servidor');
const whatsappLogger = getAppLogger('api-whatsapp');
function logLibsignalInfo(event: string, message: string, details?: Record<string, unknown>): void {
  apiServerLogger.info({ source: 'LibSignal', event, ...details }, message);
}
const libsignalSessionInfoMessages = new Map([
  ['Closing session:', 'Sessao criptografica encerrada.'],
  ['Opening session:', 'Sessao criptografica aberta.'],
  ['Removing old closed session:', 'Sessao criptografica antiga removida.']
]);
const originalConsoleInfo = console.info.bind(console);
console.info = (...args: Parameters<typeof console.info>) => {
  if (typeof args[0] === 'string') {
    const message = libsignalSessionInfoMessages.get(args[0]);
    if (message) {
      logLibsignalInfo(args[0].slice(0, -1), message);
      return;
    }
  }
  originalConsoleInfo(...args);
};
const originalConsoleWarn = console.warn.bind(console);
console.warn = (...args: Parameters<typeof console.warn>) => {
  if (args[0] === 'Session already closed' || args[0] === 'Session already open') {
    logLibsignalInfo('session_warning', `Aviso de estado da sessão criptográfica: ${args[0]}.`);
    return;
  }
  originalConsoleWarn(...args);
};
const originalConsoleError = console.error.bind(console);
console.error = (...args: Parameters<typeof console.error>) => {
  const message = args[0];
  if (message === 'Failed to decrypt message with any known session...') {
    logLibsignalInfo(
      'whatsapp_message_decrypt_failed',
      'O WhatsApp recebeu uma mensagem cifrada, mas não conseguiu descriptografá-la. O Baileys tentará solicitar o reenvio.'
    );
    return;
  }
  if (typeof message === 'string' && message.startsWith('Session error:')) {
    if (message.includes('Bad MAC')) {
      logLibsignalInfo(
        'whatsapp_session_decrypt_error',
        'A mensagem não corresponde às chaves criptográficas disponíveis nesta sessão do WhatsApp; a sessão pode estar dessincronizada.',
        { reason: 'Bad MAC' }
      );
    } else if (message.includes('Over 2000 messages into the future')) {
      logLibsignalInfo(
        'whatsapp_session_decrypt_error',
        'O contador da sessão criptográfica está fora de sincronia; o Baileys tentará recuperar a mensagem.',
        { reason: 'counter_out_of_sync' }
      );
    } else {
      logLibsignalInfo(
        'whatsapp_session_decrypt_error',
        'Nenhuma chave da sessão atual conseguiu descriptografar a mensagem recebida.'
      );
    }
    return;
  }
  originalConsoleError(...args);
};

export type WhatsAppNotificationSettings = {
  senderName: string;
  onlineMessage: string;
  warningMessage: string;
  offlineMessage: string;
  onlineMediaType: 'none' | 'sticker' | 'image';
  warningMediaType: 'none' | 'sticker' | 'image';
  offlineMediaType: 'none' | 'sticker' | 'image';
  onlineMediaId: string | null;
  warningMediaId: string | null;
  offlineMediaId: string | null;
};

type WhatsAppAlertMedia = { type: WhatsAppMediaType; id: string } | null;

const defaultNotificationSettings: WhatsAppNotificationSettings = {
  senderName: 'LAB/MONITOR',
  onlineMessage: '*TUDO OK - SISTEMA NORMALIZADO*\n\n*Laboratório:* {{laboratorio}}\n*Aparelho:* {{aparelho}}\n*Situação:* {{status}}\n*Localização:* {{localizacao}}\n*Identificador:* {{identificador}}',
  warningMessage: '*ALERTA DE ATENÇÃO*\n\n*Laboratório:* {{laboratorio}}\n*Aparelho:* {{aparelho}}\n*Situação:* {{status}}\n*Localização:* {{localizacao}}\n*Identificador:* {{identificador}}\n\nVerifique o aparelho e as condições do ambiente.',
  offlineMessage: '*APARELHO OFFLINE*\n\n*Laboratório:* {{laboratorio}}\n*Aparelho:* {{aparelho}}\n*Situação:* {{status}}\n*Localização:* {{localizacao}}\n*Identificador:* {{identificador}}\n\nVerifique a alimentação e a conectividade do aparelho.',
  onlineMediaType: 'sticker',
  warningMediaType: 'sticker',
  offlineMediaType: 'sticker',
  onlineMediaId: 'default-success',
  warningMediaId: 'default-alert',
  offlineMediaId: 'default-alert'
};

export type WhatsAppWebStatus = {
  state: 'disconnected' | 'connecting' | 'qr' | 'connected';
  qrDataUrl: string | null;
  phoneNumber: string | null;
};

export type WhatsAppWebLogEntry = {
  id: number;
  createdAt: string;
  level: 'info' | 'success' | 'error';
  event: string;
  details: string;
};

export type WhatsAppProfileSnapshot = {
  id: string;
  name: string;
  photoDataUrl: string | null;
  createdAt: string;
  isOriginal: boolean;
  restoredFromSnapshotId?: string;
};

export type WhatsAppWebProfile = {
  accountId: string;
  name: string;
  photoDataUrl: string | null;
  originalSnapshotId: string;
  history: WhatsAppProfileSnapshot[];
};

export type WhatsAppPrivacySettings = {
  lastSeen: 'all' | 'contacts' | 'contact_blacklist' | 'none';
  online: 'all' | 'match_last_seen';
  profilePhoto: 'all' | 'contacts' | 'contact_blacklist' | 'none';
  status: 'all' | 'contacts' | 'contact_blacklist' | 'none';
  readReceipts: 'all' | 'none';
  groupsAdd: 'all' | 'contacts' | 'contact_blacklist';
};

type StoredWhatsAppProfileHistory = {
  accountId: string;
  original: WhatsAppProfileSnapshot;
  snapshots: WhatsAppProfileSnapshot[];
};

let state: WhatsAppWebStatus['state'] = 'disconnected';
let qrDataUrl: string | null = null;
let phoneNumber: string | null = null;
let socket: WASocket | null = null;
let startup: Promise<void> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let disconnectRequested = false;
let nextLogId = 1;
const logs: WhatsAppWebLogEntry[] = [];
let notificationSettings = { ...defaultNotificationSettings };
let notificationSettingsLoaded = false;
let notificationSettingsLoad: Promise<void> | null = null;

function migrateWhatsAppNotificationSettings(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const stored = input as Record<string, unknown>;
  const migrateAlert = (alert: 'online' | 'warning' | 'offline', defaultMediaId: string) => {
    const mediaTypeKey = `${alert}MediaType`;
    const newMediaIdKey = `${alert}MediaId`;
    const legacyStickerId = stored[`${alert}StickerId`];
    const legacyImageId = stored[`${alert}ImageId`];
    const mediaType = stored[mediaTypeKey] === 'none' || stored[mediaTypeKey] === 'image' || stored[mediaTypeKey] === 'sticker'
      ? stored[mediaTypeKey]
      : typeof legacyImageId === 'string' ? 'image' : 'sticker';
    const mediaId = Object.hasOwn(stored, newMediaIdKey)
      ? stored[newMediaIdKey]
      : mediaType === 'none' ? null
        : mediaType === 'image' ? legacyImageId ?? null
          : legacyStickerId ?? defaultMediaId;
    return { [mediaTypeKey]: mediaType, [newMediaIdKey]: mediaId };
  };
  return {
    senderName: stored.senderName,
    onlineMessage: stored.onlineMessage,
    warningMessage: stored.warningMessage,
    offlineMessage: stored.offlineMessage,
    ...migrateAlert('online', 'default-success'),
    ...migrateAlert('warning', 'default-alert'),
    ...migrateAlert('offline', 'default-alert')
  };
}

async function persistWhatsAppNotificationSettings(settings: WhatsAppNotificationSettings): Promise<void> {
  await mkdir(resolve(process.cwd(), '.data'), { recursive: true });
  const temporaryPath = `${notificationSettingsPath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(settings, null, 2), 'utf8');
  await rename(temporaryPath, notificationSettingsPath);
}

function profileHistoryPath(accountId: string): string {
  const accountKey = createHash('sha256').update(accountId).digest('hex');
  return resolve(profileHistoryDirectory, `${accountKey}.json`);
}

async function saveProfileHistory(history: StoredWhatsAppProfileHistory): Promise<void> {
  await mkdir(profileHistoryDirectory, { recursive: true });
  const path = profileHistoryPath(history.accountId);
  const temporaryPath = `${path}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(history, null, 2), { encoding: 'utf8', mode: 0o600 });
  await rename(temporaryPath, path);
}

async function readProfileHistory(accountId: string): Promise<StoredWhatsAppProfileHistory | null> {
  try {
    const contents = await readFile(profileHistoryPath(accountId), 'utf8');
    const history = JSON.parse(contents) as StoredWhatsAppProfileHistory;
    if (history.accountId !== accountId || !history.original || !Array.isArray(history.snapshots)) {
      throw new Error('O histórico do perfil do WhatsApp está inválido.');
    }
    return history;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function captureWhatsAppProfilePhoto(activeSocket: WASocket, accountId: string): Promise<string | null> {
  const imageUrl = await activeSocket.profilePictureUrl(accountId, 'image');
  if (!imageUrl) return null;
  const response = await fetch(imageUrl, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error('Não foi possível baixar a foto atual da conta WhatsApp.');
  const declaredLength = Number(response.headers.get('content-length') ?? 0);
  if (declaredLength > 8 * 1024 * 1024) throw new Error('A foto atual da conta excede o limite de segurança.');
  const image = Buffer.from(await response.arrayBuffer());
  if (image.length > 8 * 1024 * 1024) throw new Error('A foto atual da conta excede o limite de segurança.');
  const normalizedImage = await sharp(image, { limitInputPixels: 20_000_000 })
    .rotate()
    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();
  return `data:image/webp;base64,${normalizedImage.toString('base64')}`;
}

async function ensureWhatsAppProfileHistory(activeSocket: WASocket): Promise<StoredWhatsAppProfileHistory> {
  const accountId = activeSocket.user?.id;
  if (!accountId) throw new Error('A conta WhatsApp ainda não está conectada.');
  const existingHistory = await readProfileHistory(accountId);
  if (existingHistory) return existingHistory;

  const name = activeSocket.user?.name?.trim();
  if (!name) throw new Error('Não foi possível ler o nome original do perfil WhatsApp. A edição foi bloqueada para preservar a restauração.');
  const original: WhatsAppProfileSnapshot = {
    id: randomUUID(),
    name,
    photoDataUrl: await captureWhatsAppProfilePhoto(activeSocket, accountId),
    createdAt: new Date().toISOString(),
    isOriginal: true
  };
  const history: StoredWhatsAppProfileHistory = { accountId, original, snapshots: [original] };
  await saveProfileHistory(history);
  return history;
}

export async function initializeWhatsAppWebProfileHistory(originalName: string): Promise<WhatsAppWebProfile> {
  if (!socket || state !== 'connected') throw new Error('Conecte a conta WhatsApp via QR para gerenciar o perfil.');
  const accountId = socket.user?.id;
  if (!accountId) throw new Error('A conta WhatsApp ainda não está conectada.');
  const existingHistory = await readProfileHistory(accountId);
  if (existingHistory) return toPublicWhatsAppProfile(existingHistory);
  const name = originalName.trim();
  if (!name) throw new Error('Informe o nome atual do perfil WhatsApp.');

  const original: WhatsAppProfileSnapshot = {
    id: randomUUID(),
    name,
    photoDataUrl: await captureWhatsAppProfilePhoto(socket, accountId),
    createdAt: new Date().toISOString(),
    isOriginal: true
  };
  const history: StoredWhatsAppProfileHistory = { accountId, original, snapshots: [original] };
  await saveProfileHistory(history);
  addLog('success', 'Perfil original salvo', 'Nome confirmado pelo administrador após recuperar a sessão WhatsApp.');
  return toPublicWhatsAppProfile(history);
}

function getCurrentProfileSnapshot(history: StoredWhatsAppProfileHistory): WhatsAppProfileSnapshot {
  return history.snapshots.at(-1) ?? history.original;
}

function toPublicWhatsAppProfile(history: StoredWhatsAppProfileHistory): WhatsAppWebProfile {
  const current = getCurrentProfileSnapshot(history);
  return {
    accountId: history.accountId,
    name: current.name,
    photoDataUrl: current.photoDataUrl,
    originalSnapshotId: history.original.id,
    history: [...history.snapshots].reverse().map((snapshot) => ({ ...snapshot }))
  };
}

async function applyWhatsAppProfileSnapshot(activeSocket: WASocket, current: WhatsAppProfileSnapshot, target: WhatsAppProfileSnapshot): Promise<void> {
  let nameChanged = false;
  let photoChanged = false;
  try {
    if (target.name !== current.name) {
      await activeSocket.updateProfileName(target.name);
      nameChanged = true;
    }
    if (target.photoDataUrl !== current.photoDataUrl) {
      if (target.photoDataUrl) {
        const base64 = target.photoDataUrl.slice('data:image/webp;base64,'.length);
        await activeSocket.updateProfilePicture(activeSocket.user!.id, Buffer.from(base64, 'base64'));
      } else {
        await activeSocket.removeProfilePicture(activeSocket.user!.id);
      }
      photoChanged = true;
    }
  } catch (error) {
    if (photoChanged) {
      try {
        if (current.photoDataUrl) {
          const base64 = current.photoDataUrl.slice('data:image/webp;base64,'.length);
          await activeSocket.updateProfilePicture(activeSocket.user!.id, Buffer.from(base64, 'base64'));
        } else {
          await activeSocket.removeProfilePicture(activeSocket.user!.id);
        }
      } catch { }
    }
    if (nameChanged) {
      try { await activeSocket.updateProfileName(current.name); } catch { }
    }
    throw error;
  }
}

export async function getWhatsAppWebProfile(): Promise<WhatsAppWebProfile> {
  if (!socket || state !== 'connected') throw new Error('Conecte a conta WhatsApp via QR para gerenciar o perfil.');
  return toPublicWhatsAppProfile(await ensureWhatsAppProfileHistory(socket));
}

export async function saveWhatsAppWebProfile(name: string, photoDataUrl: string | null): Promise<WhatsAppWebProfile> {
  if (!socket || state !== 'connected') throw new Error('Conecte a conta WhatsApp via QR para gerenciar o perfil.');
  const history = await ensureWhatsAppProfileHistory(socket);
  const current = getCurrentProfileSnapshot(history);
  const next: WhatsAppProfileSnapshot = {
    id: randomUUID(),
    name,
    photoDataUrl,
    createdAt: new Date().toISOString(),
    isOriginal: false
  };
  await applyWhatsAppProfileSnapshot(socket, current, next);
  if (next.name !== current.name || next.photoDataUrl !== current.photoDataUrl) {
    history.snapshots.push(next);
    try {
      await saveProfileHistory(history);
    } catch (error) {
      history.snapshots.pop();
      try { await applyWhatsAppProfileSnapshot(socket, next, current); } catch { }
      throw error;
    }
  }
  return toPublicWhatsAppProfile(history);
}

export async function restoreWhatsAppWebProfile(snapshotId: string): Promise<WhatsAppWebProfile> {
  if (!socket || state !== 'connected') throw new Error('Conecte a conta WhatsApp via QR para restaurar o perfil.');
  const history = await ensureWhatsAppProfileHistory(socket);
  const target = history.snapshots.find((snapshot) => snapshot.id === snapshotId);
  if (!target) throw new Error('A versão selecionada do perfil não foi encontrada.');
  const current = getCurrentProfileSnapshot(history);
  if (target.name !== current.name || target.photoDataUrl !== current.photoDataUrl) {
    await applyWhatsAppProfileSnapshot(socket, current, target);
    history.snapshots.push({
      id: randomUUID(),
      name: target.name,
      photoDataUrl: target.photoDataUrl,
      createdAt: new Date().toISOString(),
      isOriginal: false,
      restoredFromSnapshotId: target.id
    });
    await saveProfileHistory(history);
  }
  return toPublicWhatsAppProfile(history);
}

async function restoreOriginalWhatsAppProfile(activeSocket: WASocket): Promise<void> {
  const accountId = activeSocket.user?.id;
  if (!accountId) return;
  const history = await readProfileHistory(accountId);
  if (!history) return;
  const current = getCurrentProfileSnapshot(history);
  await applyWhatsAppProfileSnapshot(activeSocket, current, history.original);
}

function normalizePrivacySettings(values: Record<string, string>): WhatsAppPrivacySettings {
  const privacyValue = (key: string, fallback: WhatsAppPrivacySettings['lastSeen']) => {
    const value = values[key];
    return ['all', 'contacts', 'contact_blacklist', 'none'].includes(value) ? value as WhatsAppPrivacySettings['lastSeen'] : fallback;
  };
  return {
    lastSeen: privacyValue('last', 'contacts'),
    online: values.online === 'all' ? 'all' : 'match_last_seen',
    profilePhoto: privacyValue('profile', 'contacts'),
    status: privacyValue('status', 'contacts'),
    readReceipts: values.readreceipts === 'none' ? 'none' : 'all',
    groupsAdd: ['all', 'contacts', 'contact_blacklist'].includes(values.groupadd)
      ? values.groupadd as WhatsAppPrivacySettings['groupsAdd']
      : 'contacts'
  };
}

export async function getWhatsAppPrivacySettings(): Promise<WhatsAppPrivacySettings> {
  if (!socket || state !== 'connected') throw new Error('Conecte a conta WhatsApp via QR para gerenciar a privacidade.');
  return normalizePrivacySettings(await socket.fetchPrivacySettings(true));
}

export async function saveWhatsAppPrivacySettings(input: unknown): Promise<WhatsAppPrivacySettings> {
  if (!socket || state !== 'connected') throw new Error('Conecte a conta WhatsApp via QR para alterar a privacidade.');
  const activeSocket = socket;
  const parsed = whatsappPrivacySettingsSchema.safeParse(input);
  if (!parsed.success) throw new Error('As opções de privacidade informadas são inválidas.');
  const next = parsed.data;
  const current = normalizePrivacySettings(await activeSocket.fetchPrivacySettings(true));
  const updates: Array<{ apply: () => Promise<void>; rollback: () => Promise<void> }> = [];
  if (next.lastSeen !== current.lastSeen) updates.push({ apply: () => activeSocket.updateLastSeenPrivacy(next.lastSeen), rollback: () => activeSocket.updateLastSeenPrivacy(current.lastSeen) });
  if (next.online !== current.online) updates.push({ apply: () => activeSocket.updateOnlinePrivacy(next.online), rollback: () => activeSocket.updateOnlinePrivacy(current.online) });
  if (next.profilePhoto !== current.profilePhoto) updates.push({ apply: () => activeSocket.updateProfilePicturePrivacy(next.profilePhoto), rollback: () => activeSocket.updateProfilePicturePrivacy(current.profilePhoto) });
  if (next.status !== current.status) updates.push({ apply: () => activeSocket.updateStatusPrivacy(next.status), rollback: () => activeSocket.updateStatusPrivacy(current.status) });
  if (next.readReceipts !== current.readReceipts) updates.push({ apply: () => activeSocket.updateReadReceiptsPrivacy(next.readReceipts), rollback: () => activeSocket.updateReadReceiptsPrivacy(current.readReceipts) });
  if (next.groupsAdd !== current.groupsAdd) updates.push({ apply: () => activeSocket.updateGroupsAddPrivacy(next.groupsAdd), rollback: () => activeSocket.updateGroupsAddPrivacy(current.groupsAdd) });

  const appliedUpdates: typeof updates = [];
  try {
    for (const update of updates) {
      await update.apply();
      appliedUpdates.push(update);
    }
  } catch (error) {
    for (const update of appliedUpdates.reverse()) {
      try { await update.rollback(); } catch { }
    }
    throw error;
  }
  return normalizePrivacySettings(await activeSocket.fetchPrivacySettings(true));
}

async function loadWhatsAppNotificationSettings(): Promise<void> {
  if (notificationSettingsLoaded) return;
  if (!notificationSettingsLoad) {
    notificationSettingsLoad = (async () => {
      await getFavoriteWhatsAppMedia();
      try {
        const contents = await readFile(notificationSettingsPath, 'utf8');
        const stored = JSON.parse(contents) as Record<string, unknown>;
        const parsed = whatsappNotificationSettingsSchema.safeParse(migrateWhatsAppNotificationSettings(stored));
        if (parsed.success) {
          notificationSettings = parsed.data;
          if (['onlineMediaId', 'warningMediaId', 'offlineMediaId'].some((key) => !(key in stored))
            || ['onlineStickerId', 'warningStickerId', 'offlineStickerId', 'onlineImageId', 'warningImageId', 'offlineImageId'].some((key) => key in stored)) {
            await persistWhatsAppNotificationSettings(parsed.data);
          }
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      notificationSettingsLoaded = true;
    })().finally(() => {
      notificationSettingsLoad = null;
    });
  }
  await notificationSettingsLoad;
}

function addLog(level: WhatsAppWebLogEntry['level'], event: string, details: string): void {
  logs.unshift({ id: nextLogId++, createdAt: new Date().toISOString(), level, event, details });
  logs.length = Math.min(logs.length, 100);
  if (level === 'error') whatsappLogger.error({ event, details }, event);
  else whatsappLogger.info({ event, details }, event);
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `••••${digits.slice(-4)}`;
}

export function getWhatsAppWebStatus(): WhatsAppWebStatus {
  return { state, qrDataUrl, phoneNumber };
}

export function getWhatsAppWebLogs(): WhatsAppWebLogEntry[] {
  return logs.map((entry) => ({ ...entry }));
}

export function clearWhatsAppWebLogs(): void {
  logs.length = 0;
}

export async function connectWhatsAppWeb(): Promise<WhatsAppWebStatus> {
  disconnectRequested = false;
  if (startup) {
    await startup;
    return getWhatsAppWebStatus();
  }
  if (socket) return getWhatsAppWebStatus();

  state = 'connecting';
  addLog('info', 'Conectando', 'Iniciando sessão do WhatsApp Web.');
  startup = (async () => {
    const { state: authState, saveCreds } = await useMultiFileAuthState(authDirectory);
    const nextSocket = makeWASocket({ auth: authState, logger });
    socket = nextSocket;
    nextSocket.ev.on('creds.update', saveCreds);
    nextSocket.ev.on('connection.update', (update) => {
      if (socket !== nextSocket) return;
      if (update.qr) {
        if (state !== 'qr') addLog('info', 'QR code gerado', 'Aguardando leitura pelo administrador.');
        state = 'qr';
        void QRCode.toDataURL(update.qr, { width: 320, margin: 1 }).then((dataUrl) => {
          if (socket === nextSocket) qrDataUrl = dataUrl;
        });
      }
      if (update.connection === 'open') {
        state = 'connected';
        qrDataUrl = null;
        phoneNumber = nextSocket.user?.id.split(':')[0].split('@')[0] ?? null;
        addLog('success', 'Conectado', `Conta vinculada: ${maskPhone(phoneNumber ?? '')}.`);
        void ensureWhatsAppProfileHistory(nextSocket).catch((error: unknown) => {
          addLog('error', 'Falha ao salvar perfil original', error instanceof Error ? error.message : 'Não foi possível guardar o perfil original da conta.');
        });
      }
      if (update.connection === 'close') {
        socket = null;
        qrDataUrl = null;
        phoneNumber = null;
        const statusCode = (update.lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode;
        if (disconnectRequested || statusCode === DisconnectReason.loggedOut) {
          state = 'disconnected';
          addLog(disconnectRequested ? 'info' : 'error', 'Desconectado', disconnectRequested ? 'Sessão encerrada pelo administrador.' : 'A sessão foi encerrada pelo WhatsApp.');
          if (!disconnectRequested) void rm(authDirectory, { recursive: true, force: true });
          return;
        }
        state = 'connecting';
        addLog('error', 'Conexão interrompida', 'Tentando reconectar automaticamente.');
        reconnectTimer = setTimeout(() => {
          void connectWhatsAppWeb().catch(() => { state = 'disconnected'; });
        }, 2000);
      }
    });
  })().catch((error: unknown) => {
    state = 'disconnected';
    socket = null;
    addLog('error', 'Falha na conexão', 'Não foi possível iniciar a sessão do WhatsApp Web.');
    throw error;
  }).finally(() => {
    startup = null;
  });

  await startup;
  return getWhatsAppWebStatus();
}

export async function disconnectWhatsAppWeb(): Promise<WhatsAppWebStatus> {
  const activeSocket = socket;
  if (activeSocket?.user) {
    try {
      await restoreOriginalWhatsAppProfile(activeSocket);
      addLog('success', 'Perfil original restaurado', 'O nome e a foto anteriores foram restaurados antes da desconexão.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível restaurar o perfil original.';
      addLog('error', 'Falha ao restaurar perfil original', message);
      throw new Error(`Desconexão cancelada: ${message}`);
    }
  }
  disconnectRequested = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = undefined;
  socket = null;
  state = 'disconnected';
  qrDataUrl = null;
  phoneNumber = null;
  addLog('info', 'Desconectando', 'Sessão encerrada pelo administrador.');
  if (activeSocket) {
    if (activeSocket.user) await activeSocket.logout().catch(() => activeSocket.end(undefined));
    else activeSocket.end(undefined);
  }
  await rm(authDirectory, { recursive: true, force: true });
  return getWhatsAppWebStatus();
}

export async function sendWhatsAppWebMessage(phone: string, text: string, media: WhatsAppAlertMedia = null): Promise<void> {
  if (state !== 'connected' || !socket) throw new Error('WhatsApp Web não está conectado.');
  const digits = phone.replace(/\D/g, '');
  if (!digits) throw new Error('Número de WhatsApp inválido.');
  try {
    const recipient = `${digits}@s.whatsapp.net`;
    if (media?.type === 'sticker') {
      const sticker = await getFavoriteWhatsAppMediaBuffer(media.id, 'sticker');
      if (!sticker) throw new Error('A figurinha selecionada não está na biblioteca.');
      await socket.sendMessage(recipient, { sticker });
      await socket.sendMessage(recipient, { text });
    } else if (media?.type === 'image') {
      const image = await getFavoriteWhatsAppMediaBuffer(media.id, 'image');
      if (!image) throw new Error('A imagem selecionada não está na biblioteca.');
      await socket.sendMessage(recipient, { image, caption: text, mimetype: 'image/jpeg' });
    } else {
      await socket.sendMessage(recipient, { text });
    }
    addLog('success', media ? media.type === 'sticker' ? 'Alerta e figurinha enviados' : 'Alerta com imagem enviado' : 'Alerta enviado', `Destinatário ${maskPhone(digits)}.`);
  } catch (error) {
    addLog('error', 'Falha no envio', `Não foi possível enviar o alerta para ${maskPhone(digits)}.`);
    throw error;
  }
}

export async function resumeWhatsAppWebSession(): Promise<void> {
  if (!existsSync(resolve(authDirectory, 'creds.json'))) return;
  await connectWhatsAppWeb();
}

export function closeWhatsAppWebSocket(): void {
  disconnectRequested = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = undefined;
  socket?.end(undefined);
  socket = null;
  state = 'disconnected';
  qrDataUrl = null;
  phoneNumber = null;
}

export async function getWhatsAppNotificationSettings(): Promise<WhatsAppNotificationSettings> {
  await loadWhatsAppNotificationSettings();
  return { ...notificationSettings };
}

export async function saveWhatsAppNotificationSettings(settings: WhatsAppNotificationSettings): Promise<WhatsAppNotificationSettings> {
  await loadWhatsAppNotificationSettings();
  await persistWhatsAppNotificationSettings(settings);
  notificationSettings = { ...settings };
  return { ...notificationSettings };
}

export function formatWhatsAppNotificationMessage(
  settings: WhatsAppNotificationSettings,
  device: { name: string; externalId: string; location: string | null },
  status: string,
  statusLabel: string
): string {
  const template = status === 'online' ? settings.onlineMessage : status === 'warning' ? settings.warningMessage : settings.offlineMessage;
  const values: Record<string, string> = {
    laboratorio: settings.senderName,
    aparelho: device.name,
    status: statusLabel,
    localizacao: device.location || 'não informada',
    identificador: device.externalId
  };
  return template.replace(/\{\{([^{}]+)\}\}/g, (_placeholder, key: string) => values[key] ?? '');
}