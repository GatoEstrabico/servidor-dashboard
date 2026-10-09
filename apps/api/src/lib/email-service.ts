import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import nodemailer, { type Transporter } from 'nodemailer';
import { emailNotificationSettingsSchema } from './schemas.js';

export type EmailNotificationSettings = {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  senderName: string;
  senderEmail: string;
  onlineMessage: string;
  warningMessage: string;
  offlineMessage: string;
};

export type EmailNotificationSettingsInput = Omit<EmailNotificationSettings, 'smtpPassword'> & {
  smtpPassword?: string;
  clearSmtpPassword: boolean;
};

export type PublicEmailNotificationSettings = Omit<EmailNotificationSettings, 'smtpPassword'> & {
  passwordConfigured: boolean;
};

export type EmailLogEntry = {
  id: number;
  createdAt: string;
  level: 'info' | 'success' | 'error';
  event: string;
  details: string;
};

const settingsPath = resolve(process.cwd(), '.data/email-settings.json');
export const defaultEmailNotificationMessages = {
  onlineMessage: '*ALERTA NORMALIZADO*\n\n*Laboratório:* {{laboratorio}}\n*Aparelho:* {{aparelho}}\n*Situação:* {{status}}\n*Localização:* {{localizacao}}\n*Identificador:* {{identificador}}\n\nO monitoramento do aparelho foi normalizado.',
  warningMessage: '*ALERTA DE ATENÇÃO*\n\n*Laboratório:* {{laboratorio}}\n*Aparelho:* {{aparelho}}\n*Situação:* {{status}}\n*Localização:* {{localizacao}}\n*Identificador:* {{identificador}}\n\n*Recomendação:* verifique o aparelho e as condições do ambiente.',
  offlineMessage: '*APARELHO OFFLINE*\n\n*Laboratório:* {{laboratorio}}\n*Aparelho:* {{aparelho}}\n*Situação:* {{status}}\n*Localização:* {{localizacao}}\n*Identificador:* {{identificador}}\n\n*Recomendação:* verifique a alimentação elétrica e a conectividade do aparelho.'
};
const settingsDefaults: EmailNotificationSettings = {
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPassword: '',
  senderName: 'LAB/MONITOR',
  senderEmail: '',
  ...defaultEmailNotificationMessages
};

type StoredEmailSettings = Omit<EmailNotificationSettings, 'smtpPassword'> & { encryptedPassword: string };

let settings: EmailNotificationSettings = { ...settingsDefaults };
let encryptionSecret = '';
let initialized = false;
let transporter: Transporter | null = null;
let nextLogId = 1;
const logs: EmailLogEntry[] = [];

function deriveEncryptionKey(): Buffer {
  return createHash('sha256').update('lab-monitor:smtp-password:').update(encryptionSecret).digest();
}

function encryptPassword(password: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join('.');
}

function decryptPassword(encryptedPassword: string): string {
  const [encodedIv, encodedTag, encodedValue] = encryptedPassword.split('.');
  if (!encodedIv || !encodedTag || !encodedValue) throw new Error('A senha SMTP salva está inválida.');
  const decipher = createDecipheriv('aes-256-gcm', deriveEncryptionKey(), Buffer.from(encodedIv, 'base64'));
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encodedValue, 'base64')), decipher.final()]).toString('utf8');
}

function addLog(level: EmailLogEntry['level'], event: string, details: string): void {
  logs.unshift({ id: nextLogId++, createdAt: new Date().toISOString(), level, event, details });
  logs.length = Math.min(logs.length, 100);
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'destinatário protegido';
  return `${name.slice(0, 1)}***@${domain}`;
}

function createTransporter(): Transporter | null {
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword || !settings.senderEmail) return null;
  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    auth: { user: settings.smtpUser, pass: settings.smtpPassword }
  });
}

function escapeHtml(value: string): string {
  const replacements: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return value.replace(/[&<>"']/g, (character) => replacements[character] ?? character);
}

function formatEmailHtml(message: string, senderName: string): string {
  const codeSegments: string[] = [];
  let formatted = escapeHtml(message).replace(/```([\s\S]*?)```|`([^`\n]+)`/g, (_match, block: string | undefined, inline: string | undefined) => {
    const segment = block !== undefined
      ? `<pre style="padding:10px;background:#f3f5f2"><code>${block}</code></pre>`
      : `<code style="padding:2px 4px;background:#f3f5f2">${inline}</code>`;
    const token = `EMAILCODESEGMENT${codeSegments.length}TOKEN`;
    codeSegments.push(segment);
    return token;
  });
  formatted = formatted
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')
    .replace(/~([^~\n]+)~/g, '<del>$1</del>')
    .replace(/^&gt; ?([^\n]+)/gm, '<blockquote style="margin:6px 0;padding-left:10px;border-left:3px solid #aaa">$1</blockquote>')
    .replace(/^- ([^\n]+)/gm, '&bull; $1')
    .replace(/^(\d+)\. ([^\n]+)/gm, '$1. $2')
    .replace(/\r?\n/g, '<br>');
  formatted = formatted.replace(/EMAILCODESEGMENT(\d+)TOKEN/g, (_token, index: string) => codeSegments[Number(index)] ?? '');
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:24px;background:#f1f4f0;font-family:Arial,Helvetica,sans-serif;color:#26352d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;border:1px solid #dfe7df;background:#ffffff"><tr><td style="padding:18px 22px;background:#173d30;color:#ffffff"><div style="font-size:15px;font-weight:700">${escapeHtml(senderName)}</div><div style="margin-top:5px;color:#c4d9cb;font-size:10px;letter-spacing:1px">MONITORAMENTO AMBIENTAL</div></td></tr><tr><td style="padding:22px;font-size:14px;line-height:1.65">${formatted}</td></tr><tr><td style="padding:12px 22px;border-top:1px solid #e8ede8;color:#77837b;font-size:10px">Notificação automática do sistema de monitoramento.</td></tr></table></body></html>`;
}

function getPublicSettings(): PublicEmailNotificationSettings {
  const { smtpPassword, ...publicSettings } = settings;
  return { ...publicSettings, passwordConfigured: Boolean(smtpPassword) };
}

export async function initializeEmailService(defaults: EmailNotificationSettings, secret: string): Promise<void> {
  encryptionSecret = secret;
  settings = { ...defaults };
  try {
    const contents = await readFile(settingsPath, 'utf8');
    const stored = JSON.parse(contents) as StoredEmailSettings;
    const { encryptedPassword, ...storedFields } = stored;
    settings = { ...storedFields, smtpPassword: encryptedPassword ? decryptPassword(encryptedPassword) : '' };
    const parsed = emailNotificationSettingsSchema.safeParse({ ...settings, clearSmtpPassword: false });
    if (!parsed.success) throw new Error('A configuração de e-mail salva está inválida.');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  transporter = createTransporter();
  initialized = true;
}

export function getEmailNotificationSettings(): PublicEmailNotificationSettings {
  if (!initialized) throw new Error('O serviço de e-mail ainda não foi inicializado.');
  return getPublicSettings();
}

export async function saveEmailNotificationSettings(input: EmailNotificationSettingsInput): Promise<PublicEmailNotificationSettings> {
  if (!initialized) throw new Error('O serviço de e-mail ainda não foi inicializado.');
  const smtpPassword = input.clearSmtpPassword ? '' : input.smtpPassword?.trim() || settings.smtpPassword;
  const nextSettings: EmailNotificationSettings = {
    smtpHost: input.smtpHost,
    smtpPort: input.smtpPort,
    smtpSecure: input.smtpSecure,
    smtpUser: input.smtpUser,
    smtpPassword,
    senderName: input.senderName,
    senderEmail: input.senderEmail,
    onlineMessage: input.onlineMessage,
    warningMessage: input.warningMessage,
    offlineMessage: input.offlineMessage
  };
  const { smtpPassword: _secret, ...storedFields } = nextSettings;
  const stored: StoredEmailSettings = { ...storedFields, encryptedPassword: encryptPassword(smtpPassword) };
  await mkdir(resolve(process.cwd(), '.data'), { recursive: true });
  const temporaryPath = `${settingsPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(stored, null, 2), 'utf8');
  await rename(temporaryPath, settingsPath);
  settings = nextSettings;
  transporter = createTransporter();
  addLog('info', 'Configuração salva', 'As configurações SMTP foram atualizadas.');
  return getPublicSettings();
}

export function getEmailNotificationLogs(): EmailLogEntry[] {
  return logs.map((entry) => ({ ...entry }));
}

export function clearEmailNotificationLogs(): void {
  logs.length = 0;
}

export async function verifyEmailConnection(): Promise<void> {
  if (!transporter) {
    addLog('error', 'Conexão SMTP indisponível', 'Preencha host, usuário, remetente e senha SMTP.');
    throw new Error('Configure host, usuário, remetente e senha SMTP antes de testar.');
  }
  try {
    await transporter.verify();
    addLog('success', 'Conexão SMTP verificada', `Servidor ${settings.smtpHost}:${settings.smtpPort} autenticado.`);
  } catch (error) {
    const smtpError = error as { code?: string; responseCode?: number };
    const needsGoogleAppPassword = settings.smtpHost.toLowerCase() === 'smtp.gmail.com'
      && smtpError.code === 'EAUTH'
      && smtpError.responseCode === 534;
    const message = needsGoogleAppPassword
      ? 'O Gmail exige uma senha de app. Ative a verificação em duas etapas na conta Google, gere uma senha de app e salve-a no campo Senha SMTP.'
      : smtpError.code === 'EAUTH'
        ? 'O servidor SMTP recusou usuário ou senha. Confira as credenciais salvas.'
        : 'Não foi possível conectar ao servidor SMTP. Confira host, porta e TLS.';
    addLog('error', 'Falha na conexão SMTP', message);
    throw new Error(message);
  }
}

export async function sendEmailMessage(event: string, message: { to: string; subject: string; text: string }): Promise<void> {
  if (!transporter) throw new Error('Configure o envio de e-mail no menu E-mail API.');
  try {
    await transporter.sendMail({
      from: { name: settings.senderName, address: settings.senderEmail },
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: formatEmailHtml(message.text, settings.senderName)
    });
    addLog('success', event, `Enviado para ${maskEmail(message.to)}.`);
  } catch (error) {
    addLog('error', event, `Falha ao enviar para ${maskEmail(message.to)}.`);
    throw error;
  }
}