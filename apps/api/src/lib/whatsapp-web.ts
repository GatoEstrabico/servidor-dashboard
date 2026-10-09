import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, type WASocket } from '@whiskeysockets/baileys';
import { pino } from 'pino';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { whatsappNotificationSettingsSchema } from './schemas.js';
import { getAppLogger } from './app-logger.js';

const authDirectory = resolve(process.cwd(), '.data/whatsapp-auth');
const notificationSettingsPath = resolve(process.cwd(), '.data/whatsapp-settings.json');
const alertStickerPath = resolve(process.cwd(), '../../figurinha.webp');
const successStickerPath = resolve(process.cwd(), '../../sucesso.webp');
const logger = pino({ level: 'silent' });
const whatsappLogger = getAppLogger('api-whatsapp');
const libsignalLogger = getAppLogger('api-libsignal');
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
      libsignalLogger.info({ event: args[0].slice(0, -1) }, message);
      return;
    }
  }
  originalConsoleInfo(...args);
};
const originalConsoleWarn = console.warn.bind(console);
console.warn = (...args: Parameters<typeof console.warn>) => {
  if (args[0] === 'Session already closed' || args[0] === 'Session already open') {
    libsignalLogger.warn({ event: 'session_warning' }, 'Aviso de estado de sessao criptografica.');
    return;
  }
  originalConsoleWarn(...args);
};
const originalConsoleError = console.error.bind(console);
console.error = (...args: Parameters<typeof console.error>) => {
  const message = args[0];
  if (message === 'Failed to decrypt message with any known session...') {
    libsignalLogger.warn({ event: 'decrypt_failed' }, 'Falha ao descriptografar mensagem com as sessoes conhecidas.');
    return;
  }
  if (typeof message === 'string' && message.startsWith('Session error:') && message.includes('Bad MAC')) return;
  originalConsoleError(...args);
};

export type WhatsAppNotificationSettings = {
  senderName: string;
  onlineMessage: string;
  warningMessage: string;
  offlineMessage: string;
};

const defaultNotificationSettings: WhatsAppNotificationSettings = {
  senderName: 'LAB/MONITOR',
  onlineMessage: '*TUDO OK - SISTEMA NORMALIZADO*\n\n*Laboratório:* {{laboratorio}}\n*Aparelho:* {{aparelho}}\n*Situação:* {{status}}\n*Localização:* {{localizacao}}\n*Identificador:* {{identificador}}',
  warningMessage: '*ALERTA DE ATENÇÃO*\n\n*Laboratório:* {{laboratorio}}\n*Aparelho:* {{aparelho}}\n*Situação:* {{status}}\n*Localização:* {{localizacao}}\n*Identificador:* {{identificador}}\n\nVerifique o aparelho e as condições do ambiente.',
  offlineMessage: '*APARELHO OFFLINE*\n\n*Laboratório:* {{laboratorio}}\n*Aparelho:* {{aparelho}}\n*Situação:* {{status}}\n*Localização:* {{localizacao}}\n*Identificador:* {{identificador}}\n\nVerifique a alimentação e a conectividade do aparelho.'
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

let state: WhatsAppWebStatus['state'] = 'disconnected';
let qrDataUrl: string | null = null;
let phoneNumber: string | null = null;
let socket: WASocket | null = null;
let startup: Promise<void> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let disconnectRequested = false;
let nextLogId = 1;
const logs: WhatsAppWebLogEntry[] = [];
let alertSticker: Buffer | null = null;
let successSticker: Buffer | null = null;
let notificationSettings = { ...defaultNotificationSettings };
let notificationSettingsLoaded = false;
let notificationSettingsLoad: Promise<void> | null = null;

async function loadWhatsAppNotificationSettings(): Promise<void> {
  if (notificationSettingsLoaded) return;
  if (!notificationSettingsLoad) {
    notificationSettingsLoad = (async () => {
      try {
        const contents = await readFile(notificationSettingsPath, 'utf8');
        const parsed = whatsappNotificationSettingsSchema.safeParse(JSON.parse(contents));
        if (parsed.success) notificationSettings = parsed.data;
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
  disconnectRequested = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = undefined;
  const activeSocket = socket;
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

async function getAlertSticker(): Promise<Buffer> {
  if (!alertSticker) {
    const image = await readFile(alertStickerPath);
    if (image.toString('ascii', 0, 4) !== 'RIFF' || image.toString('ascii', 8, 12) !== 'WEBP') {
      throw new Error('O arquivo de figurinha não é um WebP válido.');
    }
    alertSticker = image;
  }
  return alertSticker;
}

async function getSuccessSticker(): Promise<Buffer> {
  if (!successSticker) {
    const image = await readFile(successStickerPath);
    const metadata = await sharp(image, { animated: true }).metadata();
    const frameHeight = metadata.pageHeight ?? metadata.height;
    const durationMs = (metadata.delay ?? []).reduce((total, delay) => total + delay, 0);
    if (image.toString('ascii', 0, 4) !== 'RIFF' || image.toString('ascii', 8, 12) !== 'WEBP' || metadata.format !== 'webp') {
      throw new Error('A figurinha de sucesso não é um WebP válido.');
    }
    if (metadata.width !== 512 || frameHeight !== 512 || !metadata.pages || durationMs > 10_000 || image.length > 500 * 1024) {
      throw new Error('A figurinha animada de sucesso está fora dos limites do WhatsApp.');
    }
    successSticker = image;
  }
  return successSticker;
}

export async function sendWhatsAppWebMessage(phone: string, text: string, sticker: 'alert' | 'success' | null = null): Promise<void> {
  if (state !== 'connected' || !socket) throw new Error('WhatsApp Web não está conectado.');
  const digits = phone.replace(/\D/g, '');
  if (!digits) throw new Error('Número de WhatsApp inválido.');
  try {
    const recipient = `${digits}@s.whatsapp.net`;
    await socket.sendMessage(recipient, { text });
    if (sticker) await socket.sendMessage(recipient, { sticker: sticker === 'success' ? await getSuccessSticker() : await getAlertSticker() });
    addLog('success', sticker ? 'Alerta e figurinha enviados' : 'Alerta enviado', `Destinatário ${maskPhone(digits)}.`);
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
  await mkdir(resolve(process.cwd(), '.data'), { recursive: true });
  const temporaryPath = `${notificationSettingsPath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(settings, null, 2), 'utf8');
  await rename(temporaryPath, notificationSettingsPath);
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