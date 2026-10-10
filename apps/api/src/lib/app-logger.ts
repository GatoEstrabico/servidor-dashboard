import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Writable } from 'node:stream';
import dotenv from 'dotenv';
import { pino, type Logger } from 'pino';
import { z } from 'zod';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../../.env') });

const loggingEnv = z.object({
  API_LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  API_LOG_SERVER: z.enum(['true', 'false']).default('true'),
  API_LOG_WHATSAPP: z.enum(['true', 'false']).default('true'),
  API_LOG_LIBSIGNAL: z.enum(['true', 'false']).default('false'),
  API_LOG_TO_FILE: z.enum(['true', 'false']).default('true'),
  API_LOG_FILE_PATH: z.string().min(1).default('.data/logs/api.log')
}).parse(process.env);

const enabledServices: Record<string, boolean> = {
  'api-servidor': loggingEnv.API_LOG_SERVER === 'true',
  'api-whatsapp': loggingEnv.API_LOG_WHATSAPP === 'true',
  'api-libsignal': loggingEnv.API_LOG_LIBSIGNAL === 'true'
};

const filePath = resolve(process.cwd(), loggingEnv.API_LOG_FILE_PATH);
const fileStream = loggingEnv.API_LOG_TO_FILE === 'true'
  ? (() => {
      mkdirSync(dirname(filePath), { recursive: true });
      const stream = createWriteStream(filePath, { flags: 'a', mode: 0o600 });
      stream.on('error', (error: Error) => {
        process.stderr.write(`[api-logger][${new Date().toISOString()}][ERROR] ${error.message}\n`);
      });
      return stream;
    })()
  : undefined;

const levelNames: Record<number, string> = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  60: 'FATAL'
};
const levelColors: Record<string, string> = {
  TRACE: '\u001b[90m',
  DEBUG: '\u001b[36m',
  INFO: '\u001b[32m',
  WARN: '\u001b[33m',
  ERROR: '\u001b[31m',
  FATAL: '\u001b[1;31m'
};
const timeColor = '\u001b[33m';
const colorReset = '\u001b[0m';
const brazilDateTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});

function formatBrazilDateTime(timestamp: string): string {
  const parts = new Map(brazilDateTime.formatToParts(new Date(timestamp)).map(({ type, value }) => [type, value]));
  return `${parts.get('day')}-${parts.get('month')}-${parts.get('year')} | ${parts.get('hour')}:${parts.get('minute')}:${parts.get('second')}`;
}

function colorize(value: string, color: string): string {
  if (process.env.NO_COLOR !== undefined || process.env.FORCE_COLOR === '0') return value;
  return `${color}${value}${colorReset}`;
}

const output = new Writable({
  write(chunk, _encoding, callback) {
    try {
      const entry = JSON.parse(chunk.toString()) as Record<string, unknown>;
      const service = typeof entry.service === 'string' ? entry.service : 'api-servidor';
      if (enabledServices[service] === false) {
        callback();
        return;
      }

      const timestamp = formatBrazilDateTime(typeof entry.time === 'string' ? entry.time : new Date().toISOString());
      const level = typeof entry.level === 'number' ? levelNames[entry.level] ?? String(entry.level) : 'INFO';
      const message = typeof entry.msg === 'string' ? entry.msg : '';
      const source = typeof entry.source === 'string' ? entry.source : null;
      const details = { ...entry };
      delete details.level;
      delete details.time;
      delete details.service;
      delete details.msg;
      delete details.source;
      const suffix = Object.keys(details).length ? ` ${JSON.stringify(details)}` : '';
      const consoleSuffix = source ? '' : suffix;
      const line = `[${service}][${timestamp}][${level}] ${message}${suffix}\n`;
      const coloredTimestamp = colorize(`[${timestamp}]`, timeColor);
      const coloredLevel = colorize(`[${level}]`, levelColors[level] ?? colorReset);
      const sourceLabel = source ?? (service === 'api-libsignal' ? 'LibSignal' : service);
      const consoleLine = `${colorize(`[${sourceLabel}]`, colorReset)} ${coloredTimestamp}${coloredLevel} ${message}${consoleSuffix}\n`;
      const destination = typeof entry.level === 'number' && entry.level >= 40 ? process.stderr : process.stdout;
      destination.write(consoleLine);
      fileStream?.write(line);
      callback();
    } catch (error) {
      callback(error as Error);
    }
  }
});

const rootLogger = pino({
  level: loggingEnv.API_LOG_LEVEL,
  base: {},
  timestamp: pino.stdTimeFunctions.isoTime
}, output);
const loggers = new Map<string, Logger>();

export function getAppLogger(service: 'api-servidor' | 'api-whatsapp' | 'api-libsignal'): Logger {
  const existingLogger = loggers.get(service);
  if (existingLogger) return existingLogger;
  const logger = rootLogger.child({ service });
  loggers.set(service, logger);
  return logger;
}