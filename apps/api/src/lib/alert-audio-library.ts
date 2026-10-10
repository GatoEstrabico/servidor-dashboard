import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type AudioFormat = { extension: 'mp3' | 'wav' | 'ogg' | 'webm'; mimeType: string };
type StoredAlertAudio = { id: string; fileName: string; name: string; mimeType: string };
export type AlertAudio = StoredAlertAudio & { url: string; isDefault: boolean };

const audioDirectory = resolve(process.cwd(), '../dashboard/public/audio');
const catalogPath = resolve(process.cwd(), '.data/alert-audio-library.json');
const defaultAudio: AlertAudio = {
  id: 'default',
  fileName: 'alert.mp3',
  name: 'alert.mp3',
  mimeType: 'audio/mpeg',
  url: '/audio/alert.mp3',
  isDefault: true
};
let catalog: StoredAlertAudio[] | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function audioFilePath(fileName: string): string {
  if (!/^[A-Za-z0-9_-]+\.(mp3|wav|ogg|webm)$/.test(fileName)) throw new Error('Arquivo de áudio inválido.');
  return resolve(audioDirectory, fileName);
}

function detectAudioFormat(data: Buffer): AudioFormat | null {
  if (data.length >= 3 && data.toString('ascii', 0, 3) === 'ID3') return { extension: 'mp3', mimeType: 'audio/mpeg' };
  if (data.length >= 2 && data[0] === 0xff && (data[1] & 0xe0) === 0xe0) return { extension: 'mp3', mimeType: 'audio/mpeg' };
  if (data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WAVE') return { extension: 'wav', mimeType: 'audio/wav' };
  if (data.length >= 4 && data.toString('ascii', 0, 4) === 'OggS') return { extension: 'ogg', mimeType: 'audio/ogg' };
  if (data.length >= 4 && data[0] === 0x1a && data[1] === 0x45 && data[2] === 0xdf && data[3] === 0xa3) return { extension: 'webm', mimeType: 'audio/webm' };
  return null;
}

async function persistCatalog(nextCatalog: StoredAlertAudio[]): Promise<void> {
  await mkdir(resolve(process.cwd(), '.data'), { recursive: true });
  const temporaryPath = `${catalogPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(nextCatalog, null, 2), { encoding: 'utf8', mode: 0o600 });
  await rename(temporaryPath, catalogPath);
}

async function loadCatalog(): Promise<StoredAlertAudio[]> {
  if (catalog) return catalog;
  try {
    const parsed: unknown = JSON.parse(await readFile(catalogPath, 'utf8'));
    if (!Array.isArray(parsed) || parsed.some((item) => !item.id || !item.fileName || !item.name || !item.mimeType)) {
      throw new Error('O catálogo de áudio está inválido.');
    }
    catalog = parsed as StoredAlertAudio[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    catalog = [];
  }
  return catalog;
}

export async function getAlertAudioLibrary(): Promise<AlertAudio[]> {
  const stored = await loadCatalog();
  const storedByFileName = new Map(stored.map((item) => [item.fileName, item]));
  const files = await readdir(audioDirectory, { withFileTypes: true });
  const audios: AlertAudio[] = [defaultAudio];
  for (const file of files) {
    if (!file.isFile() || file.name === defaultAudio.fileName) continue;
    let filePath: string;
    try {
      filePath = audioFilePath(file.name);
    } catch {
      continue;
    }
    const info = storedByFileName.get(file.name);
    const format = detectAudioFormat(await readFile(filePath));
    if (!format) continue;
    audios.push({
      id: info?.id ?? file.name.replace(/\.(mp3|wav|ogg|webm)$/, ''),
      fileName: file.name,
      name: info?.name ?? file.name.replace(/\.(mp3|wav|ogg|webm)$/, ''),
      mimeType: format.mimeType,
      url: `/api/account/alert-sounds/${encodeURIComponent(info?.id ?? file.name.replace(/\.(mp3|wav|ogg|webm)$/, ''))}`,
      isDefault: false
    });
  }
  return audios;
}

export async function addAlertAudio(audioName: string, audioDataUrl: string): Promise<{ audio: AlertAudio; audios: AlertAudio[] }> {
  const match = /^data:audio\/(mpeg|mp3|wav|x-wav|ogg|webm);base64,([A-Za-z0-9+/]+=*)$/.exec(audioDataUrl);
  if (!match) throw new Error('Envie um áudio MP3, WAV, OGG ou WebM válido.');
  const data = Buffer.from(match[2], 'base64');
  if (!data.length || data.length > 1024 * 1024) throw new Error('O áudio deve ter até 1 MB.');
  const format = detectAudioFormat(data);
  if (!format) throw new Error('O conteúdo do arquivo não corresponde a um áudio MP3, WAV, OGG ou WebM válido.');

  const performWrite = async (): Promise<{ audio: AlertAudio; audios: AlertAudio[] }> => {
    const id = randomUUID();
    const fileName = `${id}.${format.extension}`;
    await mkdir(audioDirectory, { recursive: true });
    await writeFile(audioFilePath(fileName), data, { mode: 0o644 });
    const nextCatalog = [...await loadCatalog(), { id, fileName, name: audioName.trim(), mimeType: format.mimeType }];
    try {
      await persistCatalog(nextCatalog);
      catalog = nextCatalog;
    } catch (error) {
      await rm(audioFilePath(fileName), { force: true });
      throw error;
    }
    const audios = await getAlertAudioLibrary();
    return { audio: audios.find((audio) => audio.id === id)!, audios };
  };
  const result = writeQueue.then(performWrite, performWrite);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

export async function getAlertAudioFile(audioId: string): Promise<{ data: Buffer; mimeType: string } | null> {
  if (audioId === defaultAudio.id) {
    return { data: await readFile(audioFilePath(defaultAudio.fileName)), mimeType: defaultAudio.mimeType };
  }
  const audios = await getAlertAudioLibrary();
  const audio = audios.find((item) => item.id === audioId);
  if (!audio) return null;
  return { data: await readFile(audioFilePath(audio.fileName)), mimeType: audio.mimeType };
}
