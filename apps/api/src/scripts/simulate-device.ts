import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

dotenv.config({ path: resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../../.env') });

const port = Number(process.env.API_PORT ?? 3000);
const ingestionKey = process.env.INGESTION_API_KEY;
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('API_PORT deve ser uma porta valida.');
}
if (!ingestionKey || ingestionKey.length < 32) {
  throw new Error('Configure INGESTION_API_KEY com pelo menos 32 caracteres no .env.');
}

const endpoint = `http://localhost:${port}/api/ingest/devices`;
const healthEndpoint = `http://localhost:${port}/health`;
const shutdown = new AbortController();
let sample = 0;

process.once('SIGINT', () => shutdown.abort());
process.once('SIGTERM', () => shutdown.abort());

async function waitForApi() {
  let attempt = 0;
  while (!shutdown.signal.aborted) {
    attempt += 1;
    try {
      const response = await fetch(healthEndpoint);
      if (response.ok) return;
      if (attempt === 1 || attempt % 10 === 0) {
        console.warn(`[simulador] API respondeu HTTP ${response.status}; aguardando disponibilidade.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt === 1 || attempt % 10 === 0) {
        console.warn(`[simulador] API indisponivel (${message}); nova tentativa em 1 segundo.`);
      }
    }
    await delay(1_000, undefined, { signal: shutdown.signal });
  }
}

async function sendReading() {
  sample += 1;
  const phase = sample / 4;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${ingestionKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      externalId: 'demo-sensor-laboratorio-01',
      name: 'Sensor de demonstracao',
      location: 'Laboratorio / Bancada de testes',
      status: 'online',
      readings: [
        { type: 'temperatura', value: Number((22.5 + Math.sin(phase) * 0.9).toFixed(1)), unit: 'C' },
        { type: 'umidade', value: Number((48 + Math.sin(phase / 1.5) * 4).toFixed(1)), unit: '%' },
        { type: 'gas', value: Math.round(180 + Math.sin(phase / 2) * 35), unit: 'ppm' }
      ]
    })
  });

  const result: unknown = await response.json();
  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'error' in result
      ? String(result.error)
      : `HTTP ${response.status}`;
    throw new Error(`Falha ao enviar leitura do aparelho ficticio: ${message}`);
  }
  console.log(`[simulador] leitura ${sample} enviada (${new Date().toLocaleTimeString()})`);
}

async function main() {
  console.log(`[simulador] enviando leituras para ${endpoint}; Ctrl+C para parar.`);
  await waitForApi();
  while (!shutdown.signal.aborted) {
    try {
      await sendReading();
    } catch (error) {
      if (shutdown.signal.aborted) break;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[simulador] ${message}; aguardando a API para tentar novamente.`);
      await delay(3_000, undefined, { signal: shutdown.signal });
      await waitForApi();
      continue;
    }
    await delay(15_000, undefined, { signal: shutdown.signal });
  }
}

main().catch((error: unknown) => {
  if (!shutdown.signal.aborted) {
    console.error('[simulador] encerrado com erro:', error);
    process.exitCode = 1;
  }
});
