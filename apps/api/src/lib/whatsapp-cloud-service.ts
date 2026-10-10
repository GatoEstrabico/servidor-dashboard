import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { whatsappCloudSettingsSchema } from './schemas.js';

export type WhatsAppCloudSettings = {
  connectionMode: 'qr' | 'cloud';
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
  templateName: string;
  templateLanguage: string;
};

export type PublicWhatsAppCloudSettings = Omit<WhatsAppCloudSettings, 'accessToken'> & {
  accessTokenConfigured: boolean;
};

type StoredWhatsAppCloudSettings = Omit<WhatsAppCloudSettings, 'accessToken'> & {
  encryptedAccessToken: string;
};

const settingsPath = resolve(process.cwd(), '.data/whatsapp-cloud-settings.json');
let settings: WhatsAppCloudSettings = {
  connectionMode: 'cloud',
  accessToken: '',
  phoneNumberId: '',
  apiVersion: 'v23.0',
  templateName: 'lab_monitor_alarm',
  templateLanguage: 'pt_BR'
};
let encryptionSecret = '';

function deriveEncryptionKey(): Buffer {
  return createHash('sha256').update('lab-monitor:whatsapp-cloud-token:').update(encryptionSecret).digest();
}

function encryptToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join('.');
}

function decryptToken(encryptedToken: string): string {
  const [encodedIv, encodedTag, encodedValue] = encryptedToken.split('.');
  if (!encodedIv || !encodedTag || !encodedValue) throw new Error('O token da WhatsApp Cloud API salvo está inválido.');
  const decipher = createDecipheriv('aes-256-gcm', deriveEncryptionKey(), Buffer.from(encodedIv, 'base64'));
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encodedValue, 'base64')), decipher.final()]).toString('utf8');
}

function validateSettings(value: WhatsAppCloudSettings): void {
  const parsed = whatsappCloudSettingsSchema.safeParse({ ...value, clearAccessToken: false });
  if (!parsed.success) throw new Error('As configurações salvas da WhatsApp Cloud API são inválidas.');
  if (value.accessToken && !value.phoneNumberId) {
    throw new Error('Configure o ID do número antes de salvar o token de acesso.');
  }
}

export async function initializeWhatsAppCloudSettings(defaults: WhatsAppCloudSettings, secret: string): Promise<void> {
  encryptionSecret = secret;
  settings = { ...defaults };
  try {
    const contents = await readFile(settingsPath, 'utf8');
    const stored = JSON.parse(contents) as StoredWhatsAppCloudSettings;
    const { encryptedAccessToken, ...storedFields } = stored;
    settings = {
      ...defaults,
      ...storedFields,
      connectionMode: stored.connectionMode ?? defaults.connectionMode,
      accessToken: encryptedAccessToken ? decryptToken(encryptedAccessToken) : ''
    };
    validateSettings(settings);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

export function getWhatsAppCloudSettings(): PublicWhatsAppCloudSettings {
  const { accessToken, ...publicSettings } = settings;
  return { ...publicSettings, accessTokenConfigured: Boolean(accessToken) };
}

export function getWhatsAppCloudRuntimeSettings(): WhatsAppCloudSettings {
  return { ...settings };
}

export async function saveWhatsAppCloudSettings(input: unknown): Promise<PublicWhatsAppCloudSettings> {
  const parsed = whatsappCloudSettingsSchema.safeParse(input);
  if (!parsed.success) throw new Error('Confira o token, o ID do número, a versão da API e os dados do modelo.');

  const accessToken = parsed.data.clearAccessToken
    ? ''
    : parsed.data.accessToken || settings.accessToken;
  const nextSettings: WhatsAppCloudSettings = {
    connectionMode: parsed.data.connectionMode,
    accessToken,
    phoneNumberId: parsed.data.phoneNumberId,
    apiVersion: parsed.data.apiVersion,
    templateName: parsed.data.templateName,
    templateLanguage: parsed.data.templateLanguage
  };
  validateSettings(nextSettings);

  const { accessToken: _secret, ...storedFields } = nextSettings;
  const stored: StoredWhatsAppCloudSettings = {
    ...storedFields,
    encryptedAccessToken: accessToken ? encryptToken(accessToken) : ''
  };
  await mkdir(resolve(process.cwd(), '.data'), { recursive: true });
  const temporaryPath = `${settingsPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(stored, null, 2), 'utf8');
  await rename(temporaryPath, settingsPath);
  settings = nextSettings;
  return getWhatsAppCloudSettings();
}