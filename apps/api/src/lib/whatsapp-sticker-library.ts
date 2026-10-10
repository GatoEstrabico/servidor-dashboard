import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

export type FavoriteWhatsAppSticker = {
  id: string;
  name: string;
  createdAt: string;
  animated: boolean;
  previewDataUrl: string;
};

type StoredFavoriteWhatsAppSticker = FavoriteWhatsAppSticker & { fileName: string };

const stickerDirectory = resolve(process.cwd(), '.data/whatsapp-stickers');
const stickerCatalogPath = resolve(stickerDirectory, 'favorites.json');
const sourceStickers = [
  { id: 'default-alert', name: 'Alerta padrão', path: resolve(process.cwd(), '../../figurinha.webp') },
  { id: 'default-success', name: 'Normalização padrão', path: resolve(process.cwd(), '../../sucesso.webp') }
];

let stickerCatalog: StoredFavoriteWhatsAppSticker[] | null = null;

function stickerFilePath(fileName: string): string {
  if (!/^[A-Za-z0-9_-]+\.webp$/.test(fileName)) throw new Error('Arquivo de figurinha inválido.');
  return resolve(stickerDirectory, fileName);
}

async function persistCatalog(catalog: StoredFavoriteWhatsAppSticker[]): Promise<void> {
  await mkdir(stickerDirectory, { recursive: true });
  const temporaryPath = `${stickerCatalogPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(catalog, null, 2), { encoding: 'utf8', mode: 0o600 });
  await rename(temporaryPath, stickerCatalogPath);
}

async function normalizeSticker(input: Buffer): Promise<{ data: Buffer; animated: boolean; previewDataUrl: string }> {
  if (!input.length || input.length > 500 * 1024) throw new Error('O arquivo WebP deve ter até 500 KB.');
  const inputImage = sharp(input, { animated: true, limitInputPixels: 20_000_000 });
  const inputMetadata = await inputImage.metadata();
  if (inputMetadata.format !== 'webp' || !inputMetadata.width || !inputMetadata.height) {
    throw new Error('O arquivo enviado não é uma figurinha WebP válida.');
  }
  const inputPageHeight = inputMetadata.pageHeight ?? inputMetadata.height;
  if (inputMetadata.width > 2048 || inputPageHeight > 2048 || (inputMetadata.pages ?? 1) > 100) {
    throw new Error('A figurinha excede as dimensões ou o número de quadros permitidos.');
  }
  const inputDuration = (inputMetadata.delay ?? []).reduce((total, delay) => total + delay, 0);
  if ((inputMetadata.pages ?? 1) > 1 && inputDuration > 10_000) {
    throw new Error('A animação deve durar no máximo 10 segundos.');
  }

  const animated = (inputMetadata.pages ?? 1) > 1;
  const sizeLimit = animated ? 500 * 1024 : 100 * 1024;
  let data = await sharp(input, { animated: true, limitInputPixels: 20_000_000 })
    .rotate()
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 80, effort: 5 })
    .toBuffer();
  if (data.length > sizeLimit) {
    data = await sharp(input, { animated: true, limitInputPixels: 20_000_000 })
      .rotate()
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 55, effort: 6 })
      .toBuffer();
  }
  if (data.length > sizeLimit) {
    throw new Error(animated ? 'A figurinha animada excede 500 KB após a conversão.' : 'A figurinha estática excede 100 KB após a conversão.');
  }

  const metadata = await sharp(data, { animated: true }).metadata();
  const pageHeight = metadata.pageHeight ?? metadata.height;
  if (metadata.width !== 512 || pageHeight !== 512 || (metadata.pages ?? 1) !== (inputMetadata.pages ?? 1)) {
    throw new Error('Não foi possível normalizar todos os quadros da figurinha.');
  }
  const preview = await sharp(data).resize(112, 112, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 72 }).toBuffer();
  return { data, animated, previewDataUrl: `data:image/webp;base64,${preview.toString('base64')}` };
}

async function seedDefaultStickers(): Promise<StoredFavoriteWhatsAppSticker[]> {
  const catalog: StoredFavoriteWhatsAppSticker[] = [];
  await mkdir(stickerDirectory, { recursive: true });
  for (const source of sourceStickers) {
    if (!existsSync(source.path)) continue;
    try {
      const normalized = await normalizeSticker(await readFile(source.path));
      const fileName = `${source.id}.webp`;
      await writeFile(stickerFilePath(fileName), normalized.data, { mode: 0o600 });
      catalog.push({ id: source.id, name: source.name, createdAt: new Date().toISOString(), animated: normalized.animated, previewDataUrl: normalized.previewDataUrl, fileName });
    } catch {
      continue;
    }
  }
  await persistCatalog(catalog);
  return catalog;
}

async function loadCatalog(): Promise<StoredFavoriteWhatsAppSticker[]> {
  if (stickerCatalog) return stickerCatalog;
  try {
    const contents = await readFile(stickerCatalogPath, 'utf8');
    const parsed = JSON.parse(contents) as StoredFavoriteWhatsAppSticker[];
    if (!Array.isArray(parsed) || parsed.some((item) => !item.id || !item.fileName || !item.previewDataUrl)) {
      throw new Error('O catálogo de figurinhas favoritas está inválido.');
    }
    stickerCatalog = parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    stickerCatalog = await seedDefaultStickers();
  }
  return stickerCatalog;
}

export async function getFavoriteWhatsAppStickers(): Promise<FavoriteWhatsAppSticker[]> {
  const catalog = await loadCatalog();
  return catalog.map(({ id, name, createdAt, animated, previewDataUrl }) => ({ id, name, createdAt, animated, previewDataUrl }));
}

export async function addFavoriteWhatsAppSticker(name: string, stickerDataUrl: string): Promise<FavoriteWhatsAppSticker[]> {
  const prefix = 'data:image/webp;base64,';
  if (!stickerDataUrl.startsWith(prefix)) throw new Error('Envie uma figurinha no formato WebP.');
  const data = Buffer.from(stickerDataUrl.slice(prefix.length), 'base64');
  const normalized = await normalizeSticker(data);
  const catalog = await loadCatalog();
  const id = randomUUID();
  const fileName = `${id}.webp`;
  await mkdir(stickerDirectory, { recursive: true });
  await writeFile(stickerFilePath(fileName), normalized.data, { mode: 0o600 });
  const nextCatalog = [...catalog, {
    id,
    name: name.trim(),
    createdAt: new Date().toISOString(),
    animated: normalized.animated,
    previewDataUrl: normalized.previewDataUrl,
    fileName
  }];
  try {
    await persistCatalog(nextCatalog);
    stickerCatalog = nextCatalog;
  } catch (error) {
    await rm(stickerFilePath(fileName), { force: true });
    throw error;
  }
  return getFavoriteWhatsAppStickers();
}

export async function getFavoriteWhatsAppStickerBuffer(stickerId: string): Promise<Buffer | null> {
  const catalog = await loadCatalog();
  const favorite = catalog.find((sticker) => sticker.id === stickerId);
  if (!favorite) return null;
  return readFile(stickerFilePath(favorite.fileName));
}